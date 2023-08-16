import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import vaultSDK from "../../lib/VaultSDK";
import { WebflowService } from "../../services/webflow";

export default function WebflowCallback (){
    const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	useEffect(() => {
        let code= searchParams.get("code");
        let error= searchParams.get("error");
        let state= searchParams.get("state");
        if(code) {
            getToken(code);
        }

    });

    async function getToken(code : string) {
        try {

            let response = await vaultSDK.getWebflowToken(code);
            WebflowService.storeToken(response.token);
            WebflowService.storeSites(response.sites);
            let nav = WebflowService.getNavigation();
            if (nav) {
                navigate(nav);
            } else {
                navigate("/developer/register?redirect_url=/developer/console");
            }
        } catch (error) {
            console.log(error);
        }
    }

    return (
        <>
        </>
    );
}