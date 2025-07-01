import '@/src/styles/components/IconType.scss';

interface IconTypeProps {
    folder: string;
    item: string;
}

export default function IconType({ folder, item }: IconTypeProps) {
    
    return (
        <div className={`type-icon ${folder}-${item}`}>
            <img src={`/icons/${folder}/${item}.png`} />
        </div>
    )
}