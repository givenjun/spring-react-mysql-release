import { Outlet, useLocation } from 'react-router-dom'
import Footer from 'layouts/Footer'
import Header from 'layouts/Header'
import { ADMIN_PATH, AUTH_PATH, MAIN_PATH } from 'constant';

//          component: 레이아웃          //
export default function Container() {

  //          state: 현재 페이지 path name 상태         //
  const { pathname } = useLocation();

  const hideLayout = document.body.classList.contains("hide-layout");

  //          render: 레이아웃 렌더링          //  
  return (
    <>
        {pathname !== MAIN_PATH() && !pathname.startsWith(ADMIN_PATH()) && !hideLayout && <Header />}
        <Outlet />
        {pathname !== AUTH_PATH() && pathname !== MAIN_PATH() && !pathname.startsWith(ADMIN_PATH()) && !hideLayout && <Footer />}
    </>
  )
}