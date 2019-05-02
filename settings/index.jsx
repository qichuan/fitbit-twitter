import {utils} from "../common/utils";

function settingsComponent(props) {
    return (
        <Page>
            <Section
                title={
                    <Text bold align="left">
                        Login Twitter
                    </Text>}>
                <Text>
                    Two steps are required to login your Twitter account.
                    Firstly click on the <Text bold>Click Me First</Text> button,
                    wait for a while, and when the <Text bold>Now Click Me</Text> button shows up,
                    click on it to open up he Twitter.com webpage. Enter your Twitter username and password
                    and hit the <Text bold>Authorize app</Text> button to finish the login process.
                </Text>
                <Text>
                    Please rest ensured that I do not keep your login credential, the whole login process
                    follows the standard <Link source="https://en.wikipedia.org/wiki/OAuth">OAuth</Link> workflow
                    of which supported by Twitter.
                </Text>
                <Webconfig
                    label={<Text bold>Click Me First</Text>}
                    status={''}
                    constructUrl={async (returnUrl, callbackUrl) => {
                        // Clear the callbackUrl and oauth_request_token
                        props.settingsStorage.setItem("callbackUrl", '');
                        props.settingsStorage.setItem('oauth_request_token', '');
                        // Set the callbackUrl, the companion will call request token API
                        props.settingsStorage.setItem("callbackUrl", callbackUrl);
                        
                        // Do not open webpage
                    }}
                    onReturn={async (query) => {
                        let parameters = utils.queryStringToObject(query);
                        props.settingsStorage.setItem("oauth_verifier", parameters["oauth_verifier"]);
                    }}
                />
                <Webconfig
                    label={<Text bold>{props.settingsStorage.getItem('oauth_request_token').length === 0 ? '...' : 'Now Click Me'}</Text>}
                    status={''}
                    constructUrl={(returnUrl, callbackUrl) => {
                        const token = props.settingsStorage.getItem('oauth_request_token');

                        // Do not open page if no oauth_request_token available;
                        if (token.length === 0) {
                            return '';
                        }
                        // Use the oauth_request_token to open the authenticate page
                        return `https://api.twitter.com/oauth/authenticate?oauth_token=${token}`;
                    }}
                    onReturn={async (query) => {
                        let parameters = utils.queryStringToObject(query);
                        props.settingsStorage.setItem("oauth_verifier", parameters["oauth_verifier"]);
                    }}
                />
                <Button
                    label="Logout"
                    onClick={() => {
                        props.settingsStorage.setItem("oauth_access_token", "");
                        props.settingsStorage.setItem("oauth_access_token_secret", "");
                    }}
                />
            </Section>
            <Section
                title={
                    <Text bold align="left">
                        Buy me a coffee ️☕️ :)
                    </Text>}>

                <Text>If you like this app and it has been useful to you, please consider buying me a coffee ☕️ :) so I will have enough energy to fix bugs, write new apps and code happily ever after. </Text>
                <Text bold>Visit: <Link source="https://www.paypal.me/QICHUAN">https://www.paypal.me/QICHUAN</Link> </Text>

            </Section>
            <Text>App icon by <Link source="https://icons8.com">icons8</Link></Text>
        </Page>
    );
}

registerSettingsPage(settingsComponent);
