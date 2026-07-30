import Script from "next/script";

export default function AdSense () {
    return (
        <>
            <Script
                id="adsense-script"
                async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5104539413199771"
                crossOrigin="anonymous"
            />
        </>
    )
}