import React, { useEffect, useState } from 'react';
import "@/src/styles/components/Modal.scss";
import CloseIcon from './svg/CloseIcon';
import { createPortal } from 'react-dom';

interface ModalProps {
    id: string;
    title?: string;
    background?: boolean,
    isOpen: boolean;
    setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>;
    canClose?: boolean;
    children?: React.ReactNode; 
}

export default function Modal({ id, title=undefined, background=true, isOpen, setIsOpen, canClose=true, children }: ModalProps) {
    const closeModal = () => {
        if (canClose && setIsOpen)
            setIsOpen(false);
    }

    const handleModalClick = (event: React.MouseEvent) => {
        event.stopPropagation();
    }

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);
    if (!mounted) return null;
    
    return createPortal(
        <div className={`modal-background ${background ? 'filter': ''}`} onClick={closeModal}>
            <section id={id} className={`modal ${isOpen ? 'open' : ''}`} onClick={handleModalClick}>
                <div className="modal-header">
                    {canClose &&
                        <button className="modal-close-button" onClick={closeModal}>
                            <CloseIcon/>
                        </button>
                    }
                </div>
                <div className="modal-content">
                    {title &&
                        <div className="modal-title modal-content-div">
                            <h1>{title}</h1>
                        </div>
                    }
                    {children}
                </div>
            </section>
        </div>
    , document.body);
}