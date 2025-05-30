export default interface CommentListItem {
    commentNumber: number;      // ✨ 댓글 고유 번호 (삭제할 댓글 식별용)
    nickname: string;
    profileImage: string | null;
    writeDatetime: string;
    content: string;
    userEmail: string;          // ✨ 댓글 작성자 이메일 (삭제 권한 확인용)
}