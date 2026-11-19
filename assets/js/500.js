document.addEventListener('DOMContentLoaded', function () {
    const retryButton = document.getElementById('btnServerRetry');

    if (retryButton) {
        retryButton.addEventListener('click', function () {
            window.location.reload();
        });
    }
});
