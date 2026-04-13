// ==UserScript==
// @name         Gitlab To Odoo
// @namespace    http://tampermonkey.net/
// @version      2024-05-01
// @description  Abre una issue de GitLab en Odoo/Gextia
// @author       Factor Libre
// @match        https://git.factorlibre.com/*
// @icon         https://factorlibre.gextia.io/web_favicon/favicon
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
    const SEARCH_FIELD = 'x_gitlab_url';   // campo donde está la URL de la issue
    // ───────────────────────────────────────────────────────────────

    function getOrAskValue(key, promptMsg) {
        let val = GM_getValue(key, '');
        if (!val) {
            val = (prompt(promptMsg) || '').replace(/\/$/, '');
            if (val) GM_setValue(key, val);
        }
        return val;
    }

    function getIssueUrl() {
        // Solo actuar en páginas de issues
        if (!window.location.pathname.match(/\/-\/issues\/\d+/)) return null;
        return window.location.href.split('?')[0];
    }

    async function findAndOpen(odoo, issueUrl, btn) {
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
                [[SEARCH_FIELD, '=', issueUrl]],
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
                alert(`No se encontró ningún registro en Odoo para:\n${issueUrl}`);
            }
        } catch (e) {
            console.error(e);
            alert('Error al buscar en Odoo. Revisa la consola.');
        } finally {
            btn.disabled = false;
            btn.querySelector('span').innerText = '🔍 Buscar en Odoo';
        }
    }

    function addButton(odoo, issueUrl) {
        const sidebar = document.querySelector(
            '.issuable-sidebar-header div[data-testid="sidebar-todo"]'
        );
        if (!sidebar) return false;

        const btn = document.createElement('button');
        btn.classList.add('btn', 'hide-collapsed', 'btn-default', 'btn-sm', 'gl-button');
        btn.innerHTML = '<span>🔍 Buscar en Odoo</span>';
        btn.style.marginTop = '8px';
        btn.addEventListener('click', () => findAndOpen(odoo, issueUrl, btn));

        sidebar.appendChild(btn);
        return true;
    }

    function waitForSidebar(odoo, issueUrl, retries = 20) {
        if (!addButton(odoo, issueUrl) && retries > 0) {
            setTimeout(() => waitForSidebar(odoo, issueUrl, retries - 1), 300);
        }
    }

    window.addEventListener('load', () => {
        const issueUrl = getIssueUrl();
        if (!issueUrl) return;

        const odooUrl = getOrAskValue('odoo_url', 'URL de tu Odoo (ej: https://factorlibre.gextia.io)');
        if (!odooUrl) return;

        const odoo = new OdooRPC(odooUrl, null, {});
        waitForSidebar(odoo, issueUrl);
    });
})();
