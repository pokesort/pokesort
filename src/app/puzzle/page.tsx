import { notFound, redirect } from 'next/navigation';

export default function AdminPage() {
    redirect('/daily');
}