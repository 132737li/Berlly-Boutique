/* =====================================================
   Protection temporaire du site en développement
   ===================================================== */

(function() {

    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'verrouillage.html') {
        return;
    }

    const unlocked = sessionStorage.getItem('berlly_site_unlocked');

    if (unlocked !== 'true') {

        // On garde la page ET ses paramètres (ex: ?token=...)
        const fullPath = currentPage + window.location.search;

        sessionStorage.setItem('berlly_redirect_after_unlock', fullPath);

        window.location.href = 'verrouillage.html';

    }

})();