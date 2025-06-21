"use client"

import ErrorSection from "../components/ErrorSection";

export default function NotFound() {

    return (
        <ErrorSection code='404' message='not-found' />
    );
}