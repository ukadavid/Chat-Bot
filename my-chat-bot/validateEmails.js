import https from 'https';

function validateEmailAddresses(eachMail) {
    return new Promise((resolve, reject) => {
        const regExp = /^[-!#$%&'+\0-9=?A-Z^_a-z`{|}~](\.?[-!#$%&'+\0-9=?A-Z^_a-z`{|}~])@[a-zA-Z0-9](-\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;

        if (regExp.test(eachMail)) {
            const val = eachMail.slice(eachMail.indexOf('@') + 1);

            https.get(`https://dns.google/resolve?name=${ val }&type=A`, (response) => {
                let data = '';
                response.on('data', (chunk) => {
                    data += chunk;
                });
                response.on('end', () => {
                    const newData = JSON.parse(data);
                    resolve(!!newData.Answer);
                });
            }).on('error', (error) => {
                reject(error);
            });
        } else {
            resolve(false);
        }
    });
}

export default validateEmailAddresses;
