// ⚠️  Firebase 설정 - 반드시 본인 프로젝트 값으로 교체하세요!
//
// 설정 방법:
//  1. https://console.firebase.google.com → 새 프로젝트 생성
//  2. [빌드] → [Realtime Database] → 데이터베이스 만들기 (테스트 모드로 시작)
//  3. [프로젝트 설정] → [내 앱] → </> 웹 앱 추가
//  4. 아래 값들을 본인 프로젝트 값으로 교체
//
// Database 보안 규칙 (권장):
// {
//   "rules": {
//     "rooms": {
//       ".read": true,
//       "$roomId": {
//         ".write": true,
//         "meta": {
//           ".validate": "newData.hasChildren(['createdAt', 'expiresAt'])"
//         },
//         "players": {
//           "$playerId": {
//             ".validate": "newData.hasChildren(['nickname', 'mainLine'])"
//           }
//         }
//       }
//     },
//     "history": {
//       ".read": true,
//       ".write": true,
//       "$historyId": {
//         ".validate": "!newData.exists() || newData.hasChildren(['createdAt', 'roomId', 'blueTeam', 'redTeam'])"
//       }
//     },
//     "historySeq": {
//       ".read": true,
//       ".write": "newData.isNumber()"
//     }
//   }
// }

const firebaseConfig = {
  apiKey: "AIzaSyC3Aiccyczo-V_t5T9dSBNjuLepjePNydw",
  authDomain: "loldraft-b1504.firebaseapp.com",
  databaseURL: "https://loldraft-b1504-default-rtdb.firebaseio.com",
  projectId: "loldraft-b1504",
  storageBucket: "loldraft-b1504.firebasestorage.app",
  messagingSenderId: "101803381671",
  appId: "1:101803381671:web:8d69b514b4b458f77e1c82",
  measurementId: "G-5014RKDVY8"
};