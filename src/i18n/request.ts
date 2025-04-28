import {getRequestConfig} from 'next-intl/server';
import { headers } from 'next/headers';
 
export default getRequestConfig(async () => {
    const requestHeaders = await headers();
    const acceptLanguage = requestHeaders.get('accept-language');

    let locale = 'en';
    if (acceptLanguage) {
        locale = acceptLanguage.split(',')[0].split('-')[0];
    }
    
    return {
        locale,
        messages: (await import(`../../messages/${locale}.json`)).default
    };
});