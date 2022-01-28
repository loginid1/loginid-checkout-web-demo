package services

type ServiceError struct {
	Error   error
	Message string
}

func NewError(message string) ServiceError {
	return ServiceError{Message: message}
}

func CreateError(message string) *ServiceError {
	return &ServiceError{Message: message}
}
