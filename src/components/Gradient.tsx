import "@/src/styles/components/Gradient.scss";

interface GradientProps {
    pathname: string | null;
}

export default function Gradient ({ pathname }: GradientProps) {

    return (
        <div id="gradient" className={pathname === `/` ? 'headless' : ''}></div>
    )
}