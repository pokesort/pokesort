import Script from "next/script";

export default function Analytics () {
    return (
        <>
            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${process.env.G_TAG}`}
                strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
                {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());

                gtag('config', '${process.env.G_TAG}');
                `}
            </Script>
        </>
    )
}