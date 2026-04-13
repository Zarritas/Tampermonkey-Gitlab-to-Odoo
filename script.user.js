// ==UserScript==
// @name         Gitlab To Odoo
// @namespace    http://tampermonkey.net/
// @version      2026-04-13
// @description  try to take over the world!
// @author       Factor Libre - Jesús Lorenzo
// @include      https://git.*.com/*
// @include      https://*.gitlab.*/*
// @icon         https://gextia.com/wp-content/uploads/2025/01/gextia-favicon-150x150.png
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @updateURL    https://github.com/Zarritas/Tampermonkey-Gitlab-to-Odoo/raw/refs/heads/main/script.user.js
// @downloadURL  https://github.com/Zarritas/Tampermonkey-Gitlab-to-Odoo/raw/refs/heads/main/script.user.js
// ==/UserScript==

(function() {
    'use strict';

    function setOdooUrl(){
        const new_url = prompt("¿Cual es la url a conectar? Ej.: 'https://odoo.tu-empresa.com'")
        if (new_url){
            GM_setValue('odoo_url', new_url)
        }else{
            GM_setValue('odoo_url',GM_getValue('odoo_url',''))
        }
    }

    window.addEventListener('load', function() {
        if (!GM_getValue('odoo_url','')?.startsWith('https://')){
            setOdooUrl()
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
            button.addEventListener('click', (event) => {
                if (event.altKey){
                     setOdooUrl()
                }else{
                    const url = window.location.href;
                    window.open(GM_getValue('odoo_url','')+"/gitlab/go-to-task?incoming_url=" + url);
                }
            });

            // Añade el botón al sidebar
            sidebar.appendChild(button);
        }
    });
})();

