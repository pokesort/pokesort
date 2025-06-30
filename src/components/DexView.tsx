import { useTranslations } from 'next-intl';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

import '@/src/styles/components/DexView.scss';
import helpDexImage from '@/src/assets/images/help_dex.png';
import Loading from './Loading';
import { toTitleCase } from '../scripts/utils';
import PokeSprite from './PokeSprite';

interface DexDataProps {
    pokemon: any;
}

const DexData = React.memo(({pokemon}: DexDataProps) => {
    const t = useTranslations();
    const default_url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;

    return (
        <section className="dex-view">
            <div className="h-group">
                <div className="sprite-block"> {/* <- this one */}
                    <PokeSprite url={default_url} />
                </div>
                <div className="v-group">
                    <div className="block">
                        <span>#{String(pokemon.dex_number).padStart(3, '0')}</span>{toTitleCase(pokemon.name)}
                    </div>
                    <div className="h-group">
                        <div className="block">
                            Geração {t(`groupnames.generation.${pokemon.generation}`)}
                        </div>
                        <div className="block">
                            {toTitleCase(pokemon.region)}
                        </div>
                    </div>
                    <div className="block">
                        {pokemon.types[0]}
                    </div>
                </div>
            </div>            
        </section>
    )
})

interface DexViewProps {
    pokemonId?: number;
}

export default function DexView ({ pokemonId }: DexViewProps) {
    const t = useTranslations();
    
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [pokemon, setPokemon] = useState<any>();

    useEffect(() => {
        setLoading(true);
        setError(null);

        const fetchPageData = async () => {
            if (!pokemonId) return;

            try {
                const headers = {
                    'Content-Type': 'application/json'
                };
                const [dexResponse] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pokemon/dex?id=${pokemonId}`, {
                        method: 'GET', headers
                    }),
                ]);
                if (!dexResponse.ok) {
                    throw new Error('Erro ao obter informações da Dex.');
                }
                const [dexData] = await Promise.all([
                    dexResponse.json(),
                ]);
              
                if (process.env.NODE_ENV === "development") {
                    console.log(dexData.pokemon);
                }
                setPokemon(dexData.pokemon);
            } catch (e) {
                console.error(e);
                setError('Não foi possível conectar ao servidor. Tente novamente.');
            } finally {                
                setLoading(false);
            }
        };

        fetchPageData();
    }, [pokemonId])

    return (
        <>
        {pokemonId ?
            !loading ?
                <DexData pokemon={pokemon} />
                :
                <Loading expand={false} />
            :
            <div className="tab-help">
                <img src={helpDexImage.src}/>
                <p>{t('puzzle.help.dex')}</p>
            </div>
        }
        </>        
    )
}