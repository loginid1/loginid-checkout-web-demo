package algo

type ASAHoldingResponse struct {
	Assets []ASAHolding `json:"assets"`
}

type ASAHolding struct {
	ID     uint64 `json:"id"`
	Name   string `json:"name"`
	Amount uint64 `json:"amount"`
}
