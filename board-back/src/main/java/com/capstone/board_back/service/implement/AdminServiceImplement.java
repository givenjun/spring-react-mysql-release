package com.capstone.board_back.service.implement;

import com.capstone.board_back.dto.response.ResponseDto;
import com.capstone.board_back.dto.response.admin.*;
import com.capstone.board_back.entity.BoardEntity;
import com.capstone.board_back.entity.UserEntity;
import com.capstone.board_back.repository.BoardRepository;
import com.capstone.board_back.repository.UserRepository;
import com.capstone.board_back.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminServiceImplement implements AdminService {

    private final UserRepository userRepository;
    private final BoardRepository boardRepository;

    private final PasswordEncoder passwordEncoder;

    @Override
    public ResponseEntity<? super GetUserListResponseDto> getUserList() {
        try {
            List<UserEntity> userList = userRepository.findAll();
            return GetUserListResponseDto.success(userList);
        } catch (Exception exception) {
            exception.printStackTrace();
            return ResponseDto.databaseError();
        }
    }

    @Override
    public ResponseEntity<? super DeleteUserResponseDto> deleteUser(String email) {
        try {
            if (!userRepository.existsById(email))
                return DeleteUserResponseDto.notExistedUser();

            userRepository.deleteById(email);
            return DeleteUserResponseDto.success();

        } catch (Exception exception) {
            exception.printStackTrace();
            return ResponseDto.databaseError();
        }
    }

    // ✅ 비밀번호 변경 로직
    @Override
    public ResponseEntity<? super UpdateUserPasswordResponseDto> updateUserPassword(String email, String newPassword) {
        try {
            UserEntity user = userRepository.findByEmail(email);
            if (user == null) return UpdateUserPasswordResponseDto.noExistUser();

            String encodedPassword = passwordEncoder.encode(newPassword);
            user.setPassword(encodedPassword);
            userRepository.save(user);

            return UpdateUserPasswordResponseDto.success();
        } catch (Exception e) {
            e.printStackTrace();
            return UpdateUserPasswordResponseDto.databaseError();
        }
    }

    @Override
    public ResponseEntity<? super GetBoardListResponseDto> getBoardList() {
        try {
            List<BoardEntity> boardList = boardRepository.findAll();
            return GetBoardListResponseDto.success(boardList);
        } catch (Exception exception) {
            exception.printStackTrace();
            return ResponseDto.databaseError();
        }
    }

    @Override
    public ResponseEntity<? super DeleteBoardResponseDto> deleteBoard(Integer boardNumber) {
        try {
            if (!boardRepository.existsById(boardNumber))
                return DeleteBoardResponseDto.notExistedBoard();

            boardRepository.deleteById(boardNumber);
            return DeleteBoardResponseDto.success();

        } catch (Exception exception) {
            exception.printStackTrace();
            return ResponseDto.databaseError();
        }
    }
}
