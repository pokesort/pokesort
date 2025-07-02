import '@/src/styles/components/IconType.scss';
import React from 'react';

interface IconTypeProps {
    folder: string;
    item: string;
}

export default React.memo(function IconType({ folder, item }: IconTypeProps) {
    
    return (
        <div className={`type-icon ${folder}-${item}`}>
            {folder != 'color' &&
                <img src={`/icons/${folder}/${item}.png`} />
            }
        </div>
    )
})