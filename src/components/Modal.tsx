import React, { useEffect, useId, useRef, useState } from 'react';
import "@/src/styles/components/Modal.scss";
import CloseIcon from './svg/CloseIcon';
import { createPortal } from 'react-dom';
import ErrorToast from './ToastError';

let ignoredPopStateEvents = 0;
let modalListenersAdded = false;
let modalOpenOrder = 0;

const getActiveModal = (): HTMLElement | null => {
    let activeModal: HTMLElement | null = null;

    document.querySelectorAll<HTMLElement>('.modal.open[data-modal-open-order]').forEach((modal) => {
        if (!activeModal || Number(modal.dataset.modalOpenOrder) > Number(activeModal.dataset.modalOpenOrder)) {
            activeModal = modal;
        }
    });

    return activeModal;
};

const requestCloseActiveModal = () => {
    getActiveModal()?.dispatchEvent(new Event('modal-close-request'));
};

const handleModalKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;

    if (!getActiveModal()) return;

    event.preventDefault();
    requestCloseActiveModal();
};

const handleModalPopState = () => {
    if (ignoredPopStateEvents > 0) {
        ignoredPopStateEvents -= 1;
        return;
    }

    requestCloseActiveModal();
};

const addModalEventListeners = () => {
    if (modalListenersAdded) return;

    window.addEventListener('keydown', handleModalKeyDown);
    window.addEventListener('popstate', handleModalPopState);
    modalListenersAdded = true;
};

interface ModalProps {
    id: string;
    title?: string;
    background?: boolean,
    isOpen: boolean;
    setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>;
    canClose?: boolean;
    error?: string | null;
    children?: React.ReactNode;
}

export default function Modal({ id, title=undefined, background=true, isOpen, setIsOpen, canClose=true, error=null, children }: ModalProps) {
    const modalRef = useRef<HTMLElement>(null);
    const historyCleanupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const historyToken = useId();

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

    useEffect(() => {
        if (!mounted || !isOpen || !canClose || !setIsOpen || !modalRef.current) return;

        if (historyCleanupTimer.current) {
            clearTimeout(historyCleanupTimer.current);
            historyCleanupTimer.current = null;
        }

        const modalElement = modalRef.current;
        modalElement.dataset.modalOpenOrder = `${++modalOpenOrder}`;

        const handleCloseRequest = () => setIsOpen(false);
        modalElement.addEventListener('modal-close-request', handleCloseRequest);
        addModalEventListeners();

        const currentState = window.history.state;
        if (currentState?.__pokesortModalToken !== historyToken) {
            const nextState = currentState && typeof currentState === 'object' ? currentState : {};
            window.history.pushState({ ...nextState, __pokesortModalToken: historyToken }, '');
        }

        return () => {
            modalElement.removeEventListener('modal-close-request', handleCloseRequest);

            if (window.history.state?.__pokesortModalToken === historyToken) {
                historyCleanupTimer.current = setTimeout(() => {
                    historyCleanupTimer.current = null;
                    if (window.history.state?.__pokesortModalToken !== historyToken || modalElement.classList.contains('open')) return;

                    ignoredPopStateEvents += 1;
                    window.history.back();
                }, 0);
            }
        };
    }, [canClose, historyToken, isOpen, mounted, setIsOpen]);

    if (!mounted) return null;
    
    return createPortal(
        <div className={`modal-background ${background ? 'filter': ''}`} onClick={closeModal}>
            <ErrorToast error={error} />
            <section id={id} ref={modalRef} className={`modal ${isOpen ? 'open' : ''}`} onClick={handleModalClick}>
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