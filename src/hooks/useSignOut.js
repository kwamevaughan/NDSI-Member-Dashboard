// useSignOut.js
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';

const useSignOut = () => {
    const router = useRouter();

    const handleSignOut = () => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        localStorage.removeItem('custom_auth_token');
        localStorage.removeItem('loginEmail');
        localStorage.removeItem('loginPassword');

        toast("You have been signed out successfully.");
        router.push('/'); // Redirect to login page
    };

    return { handleSignOut };
};

export default useSignOut;
