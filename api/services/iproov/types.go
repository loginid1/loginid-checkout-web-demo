package iproov

type EnrolmentAssuranceType string

const (
	GenuinePresence EnrolmentAssuranceType = "genuine_presence"
	Liveness        EnrolmentAssuranceType = "liveness"
)

type EnrolmentSourceType string

const (
	ElectronicID EnrolmentSourceType = "eid"
	OpticalID    EnrolmentSourceType = "oid"
	Selfie       EnrolmentSourceType = "selfie"
)

type VerificationQualityType string

const (
	NotAvailable VerificationQualityType = "not_available"
	Good         VerificationQualityType = "Good"
	Acceptable   VerificationQualityType = "Acceptable"
	Poor         VerificationQualityType = "Poor"
)

type TokenRequest struct {
	FaceImage []byte `json:"face_image"`
}

type TokenResponse struct {
	CredentialId string `json:"credential_id"`
	BaseURL      string `json:"base_url"`
	Token        string `json:"token"`
}

// Request and Response structs for
// https://<base_url>/api/v2/claim/enrol/token
type EnrolmentTokenRequest struct {
	ApiKey        string                 `json:"api_key"`
	Secret        string                 `json:"secret"`
	Resource      string                 `json:"resource"`
	AssuranceType EnrolmentAssuranceType `json:"assurance_type,omitempty"`
	UserId        string                 `json:"user_id,omitempty"`
	RiskProfile   string                 `json:"risk_profile,omitempty"`
}

type EnrolmentTokenResponse struct {
	Fallback []struct {
		Type    string `json:"type"`
		Message string `json:"message"`
	} `json:"fallback"`
	Token       string `json:"token"`
	Primary     string `json:"primary"`
	UserId      string `json:"user_id"`
	Pod         string `json:"pod"`
	RiskProfile string `json:"risk_profile,omitempty"`
}

// Request and Response structs for
// https://<base_url>/api/v2/claim/enrol/image
type EnrolmentImageRequest struct {
	ApiKey   string              `json:"api_key"`
	Secret   string              `json:"secret"`
	Rotation int                 `json:"rotation"`
	Token    string              `json:"token"`
	Source   EnrolmentSourceType `json:"source,omitempty"`
}

type EnrolmentImageResponse struct {
	Token   string `json:"token"`
	UserId  string `json:"user_id"`
	Success bool   `json:"success"`
}

// Request and Response structs for
// https://<base_url>/api/v2/claim/verify/token
type VerifyTokenRequest struct {
	ApiKey        string                 `json:"api_key"`
	Secret        string                 `json:"secret"`
	Resource      string                 `json:"resource"`
	AssuranceType EnrolmentAssuranceType `json:"assurance_type,omitempty"`
	UserId        string                 `json:"user_id,omitempty"`
	RiskProfile   string                 `json:"risk_profile,omitempty"`
}

type VerifyTokenResponse struct {
	Fallback []struct {
		Type    string `json:"type"`
		Message string `json:"message"`
	} `json:"fallback"`
	Token       string `json:"token"`
	Primary     string `json:"primary"`
	UserId      string `json:"user_id"`
	Pod         string `json:"pod"`
	RiskProfile string `json:"risk_profile,omitempty"`
}

// Request and Response structs for
// https://<base_url>/api/v2/claim/verify/validate
type ValidateTokenRequest struct {
	ApiKey      string `json:"api_key"`
	Secret      string `json:"secret"`
	UserId      string `json:"user_id,omitempty"`
	Token       string `json:"token"`
	Client      string `json:"client"`
	RiskProfile string `json:"risk_profile,omitempty"`
}

type ValidateTokenResponse struct {
	Passed         bool                   `json:"passed"`
	Token          string                 `json:"token"`
	Type           string                 `json:"type"`
	FrameAvailable bool                   `json:"frame_available"`
	FramePNG       string                 `json:"frame,omitempty"`
	FrameJPG       string                 `json:"frame_jpeg,omitempty"`
	Reason         string                 `json:"reason,omitempty"`
	RiskProfile    string                 `json:"risk_profile,omitempty"`
	AssuranceType  EnrolmentAssuranceType `json:"assurance_type,omitempty"`
	Signals        struct {
		AntiSpoofing       interface{} `json:"anti_spoofing,omitempty"`
		Matching           interface{} `json:"matching,omitempty"`
		MultipleFacesFound bool        `json:"multiple_faces_found,omitempty"`
	} `json:"signals,omitempty"`
	Quality struct {
		Blur     VerificationQualityType `json:"blur,omitempty"`
		Pose     VerificationQualityType `json:"pose,omitempty"`
		Lighting VerificationQualityType `json:"lighting,omitempty"`
	} `json:"return_frame_quality,omitempty"`
}

type ErrorResponse struct {
	Code        int    `json:"code"`
	Error       string `json:"error_description"`
	Description string `json:"error_description"`
}
