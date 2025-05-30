import { Slide, toast } from 'react-toastify';

const customErrToast = (str: string) => {
    return toast(str, {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Slide,
    });
}

export default customErrToast;