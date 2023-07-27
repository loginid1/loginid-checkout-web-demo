import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import oidcService, { OidcService } from "./services/oidc";

export function OidcCallback(){
    const [searchParams, setSearchParams] = useSearchParams();

	const navigate = useNavigate();
    useEffect(()=>{
        handleCallback();
    },[]);

    function handleCallback(){
        
            console.log("hash", document.location.hash);
            oidcService.makeTokenRequest("" );
        const code= searchParams.get("code")
        if (code != null){
            console.log("search", document.location.search);
            oidcService.makeTokenRequest(code );
            //navigate("/dashboard");
        } else {
            //navigate("/");
        }
    }
    return (<div></div>);
}