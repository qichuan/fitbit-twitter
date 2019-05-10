import {utils} from "../common/utils";

console.log('Settings page');
let settingsPageOpened = false;

function settingsComponent(props) {
    if (!settingsPageOpened) {
        console.log('Tell companion that settings page is opened');
        props.settingsStorage.setItem('settingsPageOpened', new Date().getMilliseconds() + '');
        settingsPageOpened = true;
    }
    return (
        <Page>
            <Section
                title={
                    <Text bold align="left">
                        Login Twitter
                    </Text>}>
                <Webconfig
                    label={<Text bold>{!props.settingsStorage.getItem('oauth_access_token') || props.settingsStorage.getItem('oauth_access_token').length === 0 ? 'Login' : 'Logged in successfully :)'}</Text>}
                    status={''}
                    constructUrl={(returnUrl, callbackUrl) => {
                        const requestToken = props.settingsStorage.getItem('oauth_request_token');

                        // Do not open page if no oauth_request_token available;
                        if (requestToken.length === 0) {
                            return '';
                        }
                        // Use the oauth_request_token to open the authenticate page
                        return `https://api.twitter.com/oauth/authenticate?oauth_token=${requestToken}`;
                    }}
                    onReturn={async (query) => {
                        let parameters = utils.queryStringToObject(query);
                        props.settingsStorage.setItem("oauth_verifier", parameters["oauth_verifier"]);
                    }}
                />
                <Button
                    label="Logout"
                    onClick={() => {
                        props.settingsStorage.setItem("invokeLogout", new Date().getMilliseconds() + '');
                    }}
                />
            </Section>
            <Section
                title={
                    <Text bold align="left">
                        Buy me a coffee ️☕️ :)
                    </Text>}>

                <Text>If you like this app and it has been useful to you, please consider buying me a coffee ☕️ :) </Text>
                <Text bold>Visit: <Link source="https://www.paypal.me/QICHUAN">https://www.paypal.me/QICHUAN</Link> </Text>

            </Section>
            <Text>App icon by <Link source="https://icons8.com">icons8</Link></Text>
        </Page>
    );
}

const result = registerSettingsPage(settingsComponent);
