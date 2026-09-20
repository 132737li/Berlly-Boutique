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

        sessionStorage.setItem('berlly_redirect_after_unlock', currentPage);

        window.location.href = 'verrouillage.html';

    }

})();