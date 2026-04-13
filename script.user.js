// ==UserScript==
// @name         Gitlab To Odoo
// @namespace    http://tampermonkey.net/
// @version      2026-04-13
// @description  try to take over the world!
// @author       Factor Libre - Jesús Lorenzo
// @match        https://git.factorlibre.com/*
// @icon         https://odoo.factorlibre.com/web_favicon/favicon
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @updateURL    https://github.com/Zarritas/Tampermonkey-Gitlab-to-Odoo/raw/refs/heads/main/script.user.js
// @downloadURL  https://github.com/Zarritas/Tampermonkey-Gitlab-to-Odoo/raw/refs/heads/main/script.user.js
// ==/UserScript==

(function() {
    'use strict';

    window.addEventListener('load', function() {
        if (GM_getValue('odoo_url','') === ''){
            GM_setValue('odoo_url', prompt("¿Cual es la url a conectar? Ej.: 'https://factorlibre.gextia.io'"))
        }
        // Selecciona el elemento donde quieres añadir el botón
        const sidebar = document.querySelector('.issuable-sidebar-header div[data-testid="sidebar-todo"]');
        if (sidebar) {
            // Crea el botón
            const button = document.createElement('button');
            button.classList.add('btn', 'hide-collapsed', 'btn-default', 'btn-sm', 'gl-button');
            const span = document.createElement('span');
            span.innerText = 'Abrir en Odoo';
            button.appendChild(span);

            // Añade un evento al botón para enviar la URL
            button.addEventListener('click', function() {
                const url = window.location.href;

                window.open(GM_getValue('odoo_url')+"/gitlab/go-to-task?incoming_url=" + url);
            });

            // Añade el botón al sidebar
            sidebar.appendChild(button);
        }
    });
})();

