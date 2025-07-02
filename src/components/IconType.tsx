import '@/src/styles/components/IconType.scss';
import React from 'react';

interface IconTypeProps {
    folder: string;
    item: string;
    expand?: boolean;
}

export default React.memo(function IconType({ folder, item, expand=false }: IconTypeProps) {
    
    return (
        <div className={`type-icon ${folder}-${item} ${expand ? 'expand' : ''}`}>
            {folder != 'color' &&
                <img src={`/icons/${folder}/${item}.png`} />
            }
        </div>
    )
})