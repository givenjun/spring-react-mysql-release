import {useEffect, useState} from "react"

const usePagination = <T>(countPerPage: number) => {
    //          state: 전체 객체 리스트 상태          //
    // const [totalList, setTotalList] = useState<T[]>([]);2025-05-25 PM:11
    const [totalList, setTotalListState] = useState<T[]>([]);
    //          state: 보여줄 객체 리스트 상태          //
    const [viewList, setViewList] = useState<T[]>([]);
    //          state: 현재 페이지 번호 상태          //
    const [currentPage, setCurrentPage] = useState<number>(1);

    //          state: 전체 페이지 번호 리스트 상태          //
    const [totalPageList, setTotalPageList] = useState<number[]>([1]);
    //          state: 보여줄 페이지 번호 리스트 상태          //
    const [viewPageList, setViewPageList] = useState<number[]>([]);
    //          state: 현재 색션 상태          //
    const [currentSection, setCurrentSection] = useState<number>(1);

    //          state: 전체 색션 상태          //
    const [totalSection, setTotalSection] = useState<number>(1);
    
    //          function: 보여줄 객체 리스트 추출 함수          //
    const setView = () => {
        // const FIRST_INDEX = countPerPage * (currentPage - 1);
        // const LAST_INDEX = totalList.length > countPerPage * currentPage ? countPerPage * currentPage : totalList.length;
        // const viewList = totalList.slice(FIRST_INDEX,LAST_INDEX);
        // setViewList(viewList);2025-05-25 PM:11
        const FIRST_INDEX = countPerPage * (currentPage - 1);
        const LAST_INDEX = Math.min(countPerPage * currentPage, totalList.length);
        setViewList(totalList.slice(FIRST_INDEX, LAST_INDEX));
    };
    //          function: 보여줄 페이지지 리스트 추출 함수          //
    const setViewPage = () => {
        // const FIRST_INDEX = 10 * (currentSection - 1);
        // const LAST_INDEX = totalPageList.length > 10 * currentSection ? 10 * currentSection : totalPageList.length;
        // const viewPageList = totalPageList.slice(FIRST_INDEX,LAST_INDEX);
        // setViewPageList(viewPageList);2025-05-25 PM:11
        const FIRST_INDEX = 10 * (currentSection - 1);
        const LAST_INDEX = Math.min(10 * currentSection, totalPageList.length);
        setViewPageList(totalPageList.slice(FIRST_INDEX, LAST_INDEX));
        
    };

    //          effect: total list가 변경될 때마다 실행할 작업          //
    useEffect(()=> {
        const totalPage = Math.ceil(totalList.length / countPerPage);
        const totalPageList: number[] = [];
        for(let page = 1; page <= totalPage; page++) totalPageList.push(page);
        setTotalPageList(totalPageList);
        
        const totalSection = Math.ceil(totalList.length / (countPerPage * 10));
        setTotalSection(totalSection);

        setCurrentPage(1);
        setCurrentSection(1);

        setView();
        setViewPage();//2025-05-25 PM:11

        // const totalPage = Math.ceil(totalList.length / countPerPage);
        // const pageList = Array.from({ length: totalPage }, (_, i) => i + 1);
        // setTotalPageList(pageList);

        // const sectionCount = Math.ceil(totalPage / 10);
        // setTotalSection(sectionCount);

        // setCurrentPage(1);        // 먼저 초기화하고
        // setCurrentSection(1);     // 이후 별도 effect에서 view 업데이트
    }, [totalList])
    //          effect: current page가 변경될 때마다 실행할 작업          //
    // useEffect( setView, [currentPage])2025-05-25 PM:11
    useEffect(setView, [currentPage, totalList]);
    //          effect: currentSection이 변경될 때 currentPage도 맞춰줘야 함          //
    useEffect(() => {
    const newPage = (currentSection - 1) * 10 + 1;
    setCurrentPage(newPage);
    }, [currentSection]);
    //          effect: current section이 변경될 때마다 실행할 작업          //
    // useEffect( setViewPage, [currentPage])2025-05-25 PM:11
    useEffect(setViewPage, [currentSection, totalPageList]);
    //          effect: ✅ 외부에서 리스트 설정할 수 있는 함수          //
    const setTotalList = (list: T[]) => {
        setTotalListState(list);
    };
    

    return {
        // currentPage,
        // setCurrentPage,
        // currentSection,
        // setCurrentSection,
        // viewList,
        // viewPageList,
        // totalSection,
        // setTotalList 2025-05-25 PM:11
        currentPage,
        setCurrentPage,
        currentSection,
        setCurrentSection,
        viewList,
        viewPageList,
        totalSection,
        setTotalList
    }
    
};

export default usePagination;