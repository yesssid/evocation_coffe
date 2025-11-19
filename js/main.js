/* =============================================================================
   MAIN.JS — Evocation Coffee
   ---------------------------------------------------------------------------
   Qué hace este script:
   1) Inserta el año actual en el footer.
   2) Controla el menú móvil (abrir/cerrar).
   3) Gestiona las pestañas (tabs) usando data-tab (solo se navega desde el menú).
   4) Valida el formulario de domicilios (si es “domicilio”, exige dirección).
   5) Desplaza suavemente a la zona de tabs al cambiar de sección.
   ============================================================================= */

/* ---------------------------------------
   1) Año dinámico en el footer
--------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------
     2) Menú móvil (hamburguesa)
  --------------------------------------- */
  const toggle = document.getElementById('navToggle');
  const navList = document.getElementById('navList');

  if (toggle && navList) {
    toggle.addEventListener('click', () => {
      const opened = navList.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', opened ? 'true' : 'false');
    });

    // Cierra el menú si se hace click fuera en pantallas pequeñas
    document.addEventListener('click', (e) => {
      if (!navList.classList.contains('is-open')) return;
      const clickInsideMenu = e.target.closest('#navList') || e.target.closest('#navToggle');
      if (!clickInsideMenu) {
        navList.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------------------------------------
     3) Pestañas (tabs)
     - Los botones visibles están en el menú (anchors con data-tab).
     - Los botones nativos de tabs están ocultos (.tabs--hidden) pero existen
       por accesibilidad/teclado y para mantener el rol ARIA.
  --------------------------------------- */
  const tabButtons = document.querySelectorAll('.tab');          // botones ocultos (role="tab")
  const tabPanels  = document.querySelectorAll('.tab-panel');    // paneles (role="tabpanel")
  const tabsAnchorRoot = document.getElementById('tabs');        // sección de pestañas para scroll

  /** Activa visualmente y a nivel ARIA una pestaña por su nombre (slug). */
  function activateTab(name) {
    // Botones (ocultos) con role="tab"
    tabButtons.forEach((btn) => {
      const isTarget = btn.dataset.tab === name;
      btn.classList.toggle('is-active', isTarget);
      btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
      btn.setAttribute('tabindex', isTarget ? '0' : '-1');
    });

    // Paneles
    tabPanels.forEach((panel) => {
      const isTarget = panel.id === `panel-${name}`;
      panel.toggleAttribute('hidden', !isTarget);
      panel.classList.toggle('is-active', isTarget);
    });

    // URL amigable (hash) sin recargar
    try {
      history.replaceState(null, '', `#${name}`);
    } catch { /* no-op para entornos con restricciones */ }
  }

  // Click global: cualquier elemento con [data-tab] cambia de pestaña
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-tab]');
    if (!trigger) return;

    const name = trigger.getAttribute('data-tab');
    if (!name) return;

    e.preventDefault();
    activateTab(name);

    // Cierra el menú móvil si estaba abierto
    if (navList && navList.classList.contains('is-open')) {
      navList.classList.remove('is-open');
      toggle && toggle.setAttribute('aria-expanded', 'false');
    }

    // Desplaza hacia la sección de tabs
    tabsAnchorRoot?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // Teclado en los botones "role=tab" (ocultos visualmente)
  // Permite navegar con flechas izquierda/derecha por accesibilidad.
  const orderedTabs = Array.from(tabButtons);
  if (orderedTabs.length) {
    orderedTabs.forEach((btn, idx) => {
      btn.addEventListener('keydown', (ev) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(ev.key)) return;

        ev.preventDefault();
        let nextIndex = idx;

        if (ev.key === 'ArrowRight') nextIndex = (idx + 1) % orderedTabs.length;
        if (ev.key === 'ArrowLeft')  nextIndex = (idx - 1 + orderedTabs.length) % orderedTabs.length;
        if (ev.key === 'Home')       nextIndex = 0;
        if (ev.key === 'End')        nextIndex = orderedTabs.length - 1;

        const nextBtn = orderedTabs[nextIndex];
        const name = nextBtn?.dataset.tab;
        if (name) {
          activateTab(name);
          nextBtn.focus({ preventScroll: true });
          tabsAnchorRoot?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  // Activa la pestaña desde el hash inicial (#domicilios, #promociones, etc.)
  const supported = ['domicilios', 'promociones', 'historia', 'ubicacion', 'contacto'];
  const initial = (location.hash || '#domicilios').slice(1);
  activateTab(supported.includes(initial) ? initial : 'domicilios');

  /* ---------------------------------------
     4) Validación del formulario de domicilios
     - Si el modo es "domicilio", se exige la dirección.
  --------------------------------------- */
  const orderForm = document.querySelector('.order-form');
  if (orderForm) {
    const modoSel = orderForm.querySelector('select[name="modo"]');
    const dirInp  = orderForm.querySelector('input[name="direccion"]');

    const syncDireccion = () => {
      if (!modoSel || !dirInp) return;
      const requiere = modoSel.value === 'domicilio';
      dirInp.required = requiere;
      dirInp.setAttribute('aria-required', requiere ? 'true' : 'false');
    };

    modoSel && modoSel.addEventListener('change', syncDireccion);
    syncDireccion();

    orderForm.addEventListener('submit', (e) => {
      if (modoSel && modoSel.value === 'domicilio' && dirInp && !dirInp.value.trim()) {
        e.preventDefault();
        dirInp.focus();
        alert('Por favor, ingresa la dirección para el domicilio.');
      }
    });
  }

  
});
