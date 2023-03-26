import { ContentCopy } from "@mui/icons-material";
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogProps,
	Stack,
	Typography,
} from "@mui/material";
import { useState } from "react";
import { KeyDisplay } from "../KeyDisplay";

interface TermProps extends DialogProps {
	handleClose: () => void;
}

export function TermDialog(props: TermProps) {
	function handleClose() {
		props.handleClose();
	}

	return (
		<Dialog open={props.open} fullWidth>
			<DisplayContent />
		</Dialog>
	);

	function DisplayContent() {
		return (
			<>
				<DialogContent>
					<Typography align="center" variant="h2" color="secondary">
						LoginID Vault Terms of Service
					</Typography>

					<Typography align="left" variant="body1" sx={{ p: 2 }}>
						<p>
							By clicking “Create Account” (in the LoginID Vault
							application) to these Terms of Service (or
							"Disclaimer") or by accessing the LoginID Vault, you
							acknowledge that you have read and agree to the
							following statements, disclaimers, and limitation of
							liability. If you don’t agree, you may not use the
							LoginID Vault.
						</p>
						<p>
							No Guarantee of Security. LoginID endeavors to take
							reasonable steps to protect your personal
							information. However, we cannot guarantee the
							security of any data you disclose online. By
							accessing the LoginID Vault, you accept the inherent
							security risks of providing information and dealing
							online over the Internet and will not hold us
							responsible for any breach of security.
						</p>
						<p>
							Assumption of Network Risks. You accept and
							acknowledge and accept the various risks inherent to
							using digital currency network including but not
							limited to hardware failure, software issues,
							internet connection failure, malicious software,
							third party interference leading to access to your
							Vault and other user data, unknown vulnerabilities
							and unanticipated changes to the protocol. You
							accept and acknowledge that LoginID will not be
							responsible for any communication failures,
							disruptions, errors, distortions or delays you may
							experience when using the Vault, however caused and
							will not be responsible for any harm occurring as a
							result of such risks.
						</p>
						<p>
							Assumption of Risk of Trading Digital Currencies.
							You accept and acknowledge the legal risks inherent
							in trading digital currencies. In particular, you
							acknowledge and agree that the ALGO or other tokens
							may be considered a security under US law and
							elsewhere, and that if it is so considered, it may
							not be traded in any such jurisdiction. Any trading
							of the ALGO or other tokens by you in the US or
							elsewhere is undertaken at your sole risk. No
							LoginID Liability. We will not be responsible or
							liable to you for any loss and take no
							responsibility for and will not be liable to you for
							any use of the LoginID Vault, including but not
							limited to any losses, damages or claims arising
							from:
						</p>
						<p>
							* User error such as forgotten passwords,
							incorrectly constructed transactions, or mistyped
							addresses;
							<br />
							* Server failure or data loss;
							<br />
							* Corrupted LoginID Vault files;
							<br />
							* Unauthorized access to applications;
							<br />
							* Any unauthorized third party activities, including
							without limitation the use of viruses, phishing,
							brute forcing or other means of attack against the
							LoginID Vault or services;
							<br />
							* Any enforcement action against you for illegally
							trading digital currencies.
							<br />* Any of your activities that may be unlawful
							or injurious in any way to any third party.
						</p>

						<p>
							No warranty. We make no warranty that the LoginID
							Vault is free of viruses or errors, that its content
							is accurate, that it will be uninterrupted, or that
							defects will be corrected. We will not be
							responsible or liable to you for any loss of any
							kind, from action taken, or taken in reliance on
							material, or information, contained in the LoginID
							Vault. Right to Terminate. We may terminate your
							access to and use of the Services, at our sole
							discretion, at any time and for any reason, with or
							without notice to you.
						</p>
						<p>
							LoginID reserves the right to update the LoginID
							Vault’s disclaimer and privacy policy without notice
							to users.
						</p>
						<p>
							For the avoidance of doubt and purposes of emphasis,
							the following bolded disclaimer and limitation of
							liability shall apply:
						</p>
						<p>
							YOU EXPRESSLY ACKNOWLEDGE AND AGREE THAT USE OF THE
							VAULTIS AT YOUR SOLE RISK AND THAT THE ENTIRE RISK
							AS TO SATISFACTORY QUALITY, PERFORMANCE, ACCURACY
							AND EFFORT IS WITH YOU. THE SERVICES ARE PROVIDED ON
							AN “AS IS” AND “AS AVAILABLE” BASIS WITHOUT ANY
							REPRESENTATION OR WARRANTY, WHETHER EXPRESS, IMPLIED
							OR STATUTORY. TO THE MAXIMUM EXTENT PERMITTED BY
							APPLICABLE LAW LOGINID SPECIFICALLY DISCLAIMS ANY
							EXPRESS OR IMPLIED WARRANTIES OF TITLE,
							MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE
							AND/OR NON-INFRINGEMENT. LOGINID DOES NOT MAKE ANY
							REPRESENTATIONS OR WARRANTIES THAT ACCESS TO THE
							VAULT OR ANY OF THE MATERIALS CONTAINED THEREIN WILL
							BE CONTINUOUS, UNINTERRUPTED, TIMELY, OR ERROR-FREE.
						</p>
						<p>
							TO THE MAXIMUM EXTENT NOT PROHIBITED BY LAW, LOGINID
							SHALL NOT BE LIABLE FOR DAMAGES OF ANY TYPE, WHETHER
							DIRECT OR INDIRECT, ARISING OUT OF OR IN ANY WAY
							RELATED TO YOUR USE OR INABILITY TO USE THE VAULT
							INCLUDING BUT NOT LIMITED TO DAMAGES ALLEGEDLY
							ARISING FROM THE COMPROMISE OR LOSS OF YOUR LOGIN
							CREDENTIALS OR FUNDS, OR LOSS OF OR INABILITY TO
							RESTORE ACCESS FROM YOUR BACKUP PHRASE, OR FOR
							MISTAKES, OMISSIONS, INTERRUPTIONS, DELAYS, DEFECTS
							AND/OR ERRORS IN THE TRANSMISSION OF TRANSACTIONS OR
							MESSAGES TO THE NETWORK, OR THE FAILURE OF ANY
							MESSAGE TO SEND OR BE RECEIVED BY THE INTENDED
							RECIPIENT IN THE INTENDED FORM, OR FOR DIMINUTION OF
							VALUE OF ETHER OR ANY OTHER DIGITAL TOKEN OR DIGITAL
							ASSET ON THE NETWORK.
						</p>
						<p>
							LOGINID SHALL NOT BE LIABLE UNDER ANY CIRCUMSTANCES
							FOR ANY LOST PROFITS OR ANY SPECIAL, INCIDENTAL,
							INDIRECT, INTANGIBLE, OR CONSEQUENTIAL DAMAGES,
							WHETHER BASED IN CONTRACT, TORT, NEGLIGENCE, STRICT
							LIABILITY, OR OTHERWISE, ARISING OUT OF OR IN
							CONNECTION WITH AUTHORIZED OR UNAUTHORIZED USE OF
							THE VAULT, EVEN IF AN AUTHORIZED REPRESENTATIVE OF
							LOGINID HAS BEEN ADVISED OF OR KNEW OR SHOULD HAVE
							KNOWN OF THE POSSIBILITY OF SUCH DAMAGES.
						</p>

						<p>
							The contents and materials available in our LoginID
							Vault (including, but not limited to, text,
							graphics, images, pictures, logos, page headers,
							button icons, scripts, sound files or any other
							files, and the selection and arrangement thereof)
							are property of LoginID and are protected under
							copyright, trademark rights and other industrial and
							intellectual property rights (“IP”).
						</p>

						<p>
							By using our app, you agree not to take any
							action(s) inconsistent with such IP rights and
							interests, namely, you shall not copy, use,
							reproduce or broadcast, in whole or in part, any
							contents and materials without LoginID’s prior
							written permission.
						</p>

						<p>
							All other third-party IP rights displayed on our
							LoginID Vault are property of their respective right
							holders and may not be copied, used, reproduced or
							broadcast, in whole or in part, without their
							permission.
						</p>

						<p>
							Reference to any websites, services or other
							information by name, trademark, manufacturer,
							supplier or otherwise does not constitute or imply
							endorsement, sponsorship, or recommendation by
							LoginID.
						</p>

						<p>
							Our LoginID Vault provides content of its own and
							content made available by third parties. LoginID
							reserves the right to modify at any time the
							presentation, configuration and location of the
							LoginID Vault and/or the respective contents and
							materials. LoginID does not guarantee the
							reliability, truthfulness, accuracy, exhaustiveness,
							and timeliness of third-party content on our app.
						</p>

						<p>
							At any time and without prior notice, LoginID
							reserves the right to change or update all
							information in our LoginID Vault. LoginID Vault only
							provides links to the websites that it considers to
							be compliant with the applicable legislation and it
							reserves the right to remove links to any website,
							for any reason, and without prior notice,
							particularly if it becomes aware that the activities
							carried out on such website or its content are
							illegal or infringe the rights of third-parties, or
							if ordered to do so by court or administrative
							decision. LoginID reserves the right, whenever it
							deems necessary, to change, add or delete parts of
							these terms of service without prior notice.
							Periodical consultation of these terms of service
							is, therefore, advised.
						</p>
						<p>
							These terms of service are governed by and shall be
							construed in accordance with the laws of the state
							of Delaware, USA. Any dispute arising from the use
							of our LoginID Vault shall be governed by Delaware
							law and shall be submitted to the exclusive
							jurisdiction of the state of Delaware courts.
						</p>
					</Typography>
				</DialogContent>
				<DialogActions sx={{ justifyContent: "center", mb: 2 }}>
					<Button variant="text" onClick={() => handleClose()}>
						Close
					</Button>
				</DialogActions>
			</>
		);
	}
}
