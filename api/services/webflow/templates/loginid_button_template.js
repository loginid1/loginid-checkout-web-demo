
window.onload = function () {
    const loginidDom = document.getElementById('loginid-button');
    loginidDom.addEventListener('click', async function(event){
        event.preventDefault();
        let api = loginidDom.getAttribute("loginid-api");
        if(api == null) {
            api = '{{.AppID}}';
        }
        const wallet = new loginid.WalletSDK(
            '{{.WalletURL}}', api, null
            );
        const response = await wallet.signup();
        document.cookie = 'loginid-token='+response.token;
        localStorage.removeItem("loginid-token-signature");
            
        let redirect_success = loginidDom.getAttribute("loginid-success");
        if (redirect_success) {
            document.location.href=redirect_success;
        } else {
            redirect_success = loginidDom.getAttribute("href");
            document.location.href=redirect_success;
        }
    });
}