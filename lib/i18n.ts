export type SupportedLocale = "ko" | "en"

export function getPreferredLocale(acceptLanguage: string | null | undefined): SupportedLocale {
  if (!acceptLanguage) return "ko"

  // Very small parser: take highest-priority tag, map to supported locales
  // Examples: "en-US,en;q=0.9,ko;q=0.8" => "en"
  const first = acceptLanguage.split(",")[0]?.trim().toLowerCase()
  if (!first) return "ko"

  if (first.startsWith("en")) return "en"
  if (first.startsWith("ko")) return "ko"

  return "ko"
}

const MESSAGES = {
  ko: {
    // Generic API errors
    AUTH_REQUIRED: "인증이 필요합니다.",
    FORBIDDEN: "권한이 없습니다.",
    NOT_FOUND: "리소스를 찾을 수 없습니다.",
    BAD_REQUEST: "잘못된 요청입니다.",
    SERVER_ERROR: "서버 오류가 발생했습니다.",
    INVALID_JSON: "요청 본문(JSON)이 올바르지 않습니다.",

    // Domain/validation codes
    PROJECT_NAME_REQUIRED: "프로젝트 이름은 필수입니다.",
    TASK_TITLE_REQUIRED: "제목은 필수입니다.",
    TRANSACTION_REQUIRED_FIELDS: "필수 항목을 모두 입력해주세요.",
    TRANSACTION_INVALID_TYPE: "거래 유형이 올바르지 않습니다.",
    MILESTONE_REQUIRED_FIELDS: "제목과 마감일은 필수입니다.",
    MEMBER_ROLE_REQUIRED: "role이 필요합니다.",
    MEMBER_INVALID_ROLE: "유효하지 않은 역할입니다.",
    MEMBER_IDENTIFIER_REQUIRED: "userId 또는 email이 필요합니다.",

    // Analyze-file
    NO_FILE: "파일이 제공되지 않았습니다.",
    ANALYZE_FAILED: "파일 분석에 실패했습니다.",
    ML_SERVICE_ERROR: "분석 서비스 오류가 발생했습니다.",

    // Auth/register
    REGISTER_FIELDS_REQUIRED: "모든 필드를 입력해주세요.",
    REGISTER_PASSWORD_MIN: "비밀번호는 최소 8자 이상이어야 합니다.",
    REGISTER_EMAIL_IN_USE: "이미 사용 중인 이메일입니다.",
    REGISTER_SUCCESS: "회원가입이 완료되었습니다.",

    // Documents/OCR
    DOCUMENT_FILENAME_REQUIRED: "파일 이름은 필수입니다.",
    DOCUMENT_CONTENT_TYPE_REQUIRED: "contentType은 필수입니다.",
    DOCUMENT_QUERY_REQUIRED: "검색어(q)는 필수입니다.",
    DOCUMENT_NOT_FOUND: "문서를 찾을 수 없습니다.",
    DOCUMENT_PROCESS_FAILED: "문서 OCR 처리에 실패했습니다.",
  },
  en: {
    // Generic API errors
    AUTH_REQUIRED: "Authentication required.",
    FORBIDDEN: "You do not have permission.",
    NOT_FOUND: "Resource not found.",
    BAD_REQUEST: "Bad request.",
    SERVER_ERROR: "An unexpected server error occurred.",
    INVALID_JSON: "Invalid JSON body.",

    // Domain/validation codes
    PROJECT_NAME_REQUIRED: "Project name is required.",
    TASK_TITLE_REQUIRED: "Title is required.",
    TRANSACTION_REQUIRED_FIELDS: "Please fill in all required fields.",
    TRANSACTION_INVALID_TYPE: "Transaction type is invalid.",
    MILESTONE_REQUIRED_FIELDS: "Title and due date are required.",
    MEMBER_ROLE_REQUIRED: "Role is required.",
    MEMBER_INVALID_ROLE: "Role is invalid.",
    MEMBER_IDENTIFIER_REQUIRED: "Either userId or email is required.",

    // Analyze-file
    NO_FILE: "No file provided.",
    ANALYZE_FAILED: "Failed to analyze file.",
    ML_SERVICE_ERROR: "An analysis service error occurred.",

    // Auth/register
    REGISTER_FIELDS_REQUIRED: "Please fill in all fields.",
    REGISTER_PASSWORD_MIN: "Password must be at least 8 characters.",
    REGISTER_EMAIL_IN_USE: "This email is already in use.",
    REGISTER_SUCCESS: "Registration completed.",

    // Documents/OCR
    DOCUMENT_FILENAME_REQUIRED: "Filename is required.",
    DOCUMENT_CONTENT_TYPE_REQUIRED: "contentType is required.",
    DOCUMENT_QUERY_REQUIRED: "Query parameter q is required.",
    DOCUMENT_NOT_FOUND: "Document not found.",
    DOCUMENT_PROCESS_FAILED: "Failed to process document OCR.",
  },
} as const

export type MessageKey = keyof (typeof MESSAGES)["ko"]

export function t(locale: SupportedLocale, key: MessageKey): string {
  return MESSAGES[locale][key]
}

export type ApiErrorLike = {
  statusCode: number
  message: string
  code?: string
}

export function tApiError(locale: SupportedLocale, error: ApiErrorLike): string {
  // Preserve existing Korean messages as-is.
  if (locale === "ko") return error.message

  const codeKey = error.code as MessageKey | undefined
  if (codeKey && codeKey in MESSAGES.en) return t("en", codeKey)

  switch (error.statusCode) {
    case 400:
      return t("en", "BAD_REQUEST")
    case 401:
      return t("en", "AUTH_REQUIRED")
    case 403:
      return t("en", "FORBIDDEN")
    case 404:
      return t("en", "NOT_FOUND")
    default:
      return t("en", "SERVER_ERROR")
  }
}
