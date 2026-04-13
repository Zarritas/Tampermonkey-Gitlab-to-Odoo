// ==UserScript==
// @name         Gitlab To Odoo
// @namespace    http://tampermonkey.net/
// @version      2024-05-01
// @description  Abre una issue de GitLab en Odoo/Gextia
// @author       Factor Libre
// @match        https://git.factorlibre.com/*
// @icon         https://odoo.factorlibre.com/web_favicon/favicon
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      *
// @require      https://raw.githubusercontent.com/Zarritas/tampermonkey-odoo-rpc/main/OdooRPC.js
// ==/UserScript==

(function () {
    'use strict';

    // ── Config ─────────────────────────────────────────────────────
    const ODOO_MODEL   = 'project.task';
    const SEARCH_FIELD = 'gitlab_issue_id';
    // ───────────────────────────────────────────────────────────────

    function getOrAskValue(key, promptMsg) {
        let val = GM_getValue(key, '');
        if (!val) {
            val = (prompt(promptMsg) || '').replace(/\/$/, '');
            if (val) GM_setValue(key, val);
        }
        return val;
    }

    function getProjectAndIssue() {
        const m = window.location.pathname.match(/^(\/[^/]+\/[^/]+)\/-\/issues\/(\d+)/);
        if (!m) return null;
        return {
            projectPath: m[1],  // "/grupo/repo"
            issueIid: m[2],     // número local del proyecto
        };
    }

    async function getGitlabIssueId(projectPath, issueIid) {
        const encodedPath = encodeURIComponent(projectPath.replace(/^\//, ''));
        const apiUrl = `https://git.factorlibre.com/api/v4/projects/${encodedPath}/issues/${issueIid}`;
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
    
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: apiUrl,
                headers: {
                    'X-CSRF-Token': csrfToken,
                },
                withCredentials: true,
                onload(res) {
                    try {
                        const data = JSON.parse(res.responseText);
                        if (data.id) {
                            resolve(data.id);
                        } else {
                            reject(new Error('No id en respuesta GitLab'));
                        }
                    } catch (e) {
                        reject(e);
                    }
                },
                onerror: reject,
            });
        });
    }

    async function findAndOpen(odoo, globalIssueId, btn) {
        btn.disabled = true;
        btn.querySelector('span').innerText = 'Buscando...';

        try {
            const authenticated = await odoo.authenticate();
            if (!authenticated) {
                alert('No se pudo autenticar en Odoo. ¿Estás logueado?');
                return;
            }

            const results = await odoo.odooSearch(
                ODOO_MODEL,
                [[SEARCH_FIELD, '=', globalIssueId]],
                1,
                ['id', 'name']
            );

            if (results?.records?.length > 0) {
                const record = results.records[0];
                window.open(
                    `${odoo.url}/web#model=${ODOO_MODEL}&id=${record.id}&view_type=form`,
                    '_blank'
                );
            } else {
                alert(`No se encontró ninguna tarea en Odoo para la issue #${globalIssueId}`);
            }
        } catch (e) {
            console.error(e);
            alert('Error al buscar en Odoo. Revisa la consola.');
        } finally {
            btn.disabled = false;
            btn.querySelector('span').innerText = '🔍 Buscar en Odoo';
        }
    }

    function addButton(odoo, globalIssueId) {
        const sidebar = document.querySelector(
            '.issuable-sidebar-header div[data-testid="sidebar-todo"]'
        );
        if (!sidebar) return false;

        const btn = document.createElement('button');
        btn.classList.add('btn', 'hide-collapsed', 'btn-default', 'btn-sm', 'gl-button');
        btn.innerHTML = '<span>🔍 Buscar en Odoo</span>';
        btn.style.marginTop = '8px';
        btn.addEventListener('click', () => findAndOpen(odoo, globalIssueId, btn));

        sidebar.appendChild(btn);
        return true;
    }

    function waitForSidebar(odoo, globalIssueId, retries = 20) {
        if (!addButton(odoo, globalIssueId) && retries > 0) {
            setTimeout(() => waitForSidebar(odoo, globalIssueId, retries - 1), 300);
        }
    }

    window.addEventListener('load', () => {
        const info = getProjectAndIssue();
        if (!info) return;

        const odooUrl = getOrAskValue('odoo_url', 'URL de tu Odoo (ej: https://gextia.factorlibre.com)');
        if (!odooUrl) return;

        const odoo = new OdooRPC(odooUrl, null, {});

        getGitlabIssueId(info.projectPath, info.issueIid)
            .then(globalId => waitForSidebar(odoo, globalId))
            .catch(() => alert('No se pudo obtener el ID global de la issue de GitLab. ¿Estás logueado?'));
    });
})();
