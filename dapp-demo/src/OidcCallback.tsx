import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import oidcService, { OidcService } from "./services/oidc";

export function OidcCallback() {
	const [searchParams, setSearchParams] = useSearchParams();

	const navigate = useNavigate();
	useEffect(() => {
		handleCallback();
	}, []);

	async function handleCallback() {
		console.log("hash", document.location.hash);
        try {
		    let result = await oidcService.makeTokenRequest();
            navigate("/dashboard");
        } catch(error) {
			navigate("/");
        }
	}
	return <div></div>;
}
