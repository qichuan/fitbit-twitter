import {utils} from "../common/utils";

console.log('Settings page');

let myProps;

function setWebConfigRef(element) {
    setTimeout(() => {
        console.log('Tell companion that settings page is opened');
        const state = element.state;
        const callbackUri = state.callbackUri;
        myProps.settingsStorage.setItem('settingsPageOpened', new Date().getMilliseconds() + '');
        myProps.settingsStorage.setItem('callbackUri', callbackUri);
        console.log(callbackUri);
    }, 500);
}
          
function settingsComponent(props) {
    myProps = props;

    const requestTokenNotEmpty = props.settingsStorage.getItem('oauth_request_token') != null && props.settingsStorage.getItem('oauth_request_token').length > 0;
    const accessTokenNotEmpty = props.settingsStorage.getItem('oauth_access_token') != null && props.settingsStorage.getItem('oauth_access_token').length > 0;
    let status = 'Please Wait...';
    if (accessTokenNotEmpty) {
        status = 'Logged in successfully :)';
    } else {
        if (requestTokenNotEmpty) {
            status = ''
        } else {
            status = 'Please Wait...';
        }
    }
    
    return (
        <Page>
            <Section
                title={
                    <Text bold align="left">
                        Login Twitter
                    </Text>}>
                <Webconfig
                    ref={setWebConfigRef}
                    label={<Text bold>{'Login'}</Text>}
                    status={status}
                    constructUrl={(returnUrl, callbackUrl) => {
                        const requestToken = props.settingsStorage.getItem('oauth_request_token');

                        // Do not open page if no oauth_request_token available;
                        if (!requestTokenNotEmpty || accessTokenNotEmpty) {
                            return '';
                        }
                        // Use the oauth_request_token to open the authenticate page
                        return `https://api.twitter.com/oauth/authenticate?oauth_token=${requestToken}`;
                    }}
                    onReturn={async (query) => {
                        console.log('onReturn called');
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
