package test

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"os"
)

func main() {
	decode4("MyDXNAqXANkA_i3V8Tz7sTf2y_h7l8DYBeVHneaFPGU")
	decode4("n9UJtaKyA0sPk_4NGNSTjVXmZDKl08cj-E94PQJGXPk")

	client_data := "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiTG5MMmozR1NSR3E0dk9uT1pjdGdDZkQxdHJPQ1pWLXRXU3pDdlhJZ0V6TSIsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzAwMCIsImNyb3NzT3JpZ2luIjpmYWxzZX0"
	value, err := opJSONRef(client_data, "challenge")
	if err != nil {
		fmt.Println(err)
	}
	fmt.Println(value)
	decode4(value + "=")
}

func decode4(s string) {

	encoding := base64.URLEncoding

	encoded := []byte(s)
	if !base64padded(encoded) {
		encoding = encoding.WithPadding(base64.NoPadding)
	}
	bytes, err := base64Decode(encoded, encoding.Strict())
	fmt.Printf("\n%d %v\n", bytes, err)
}

// base64padded returns true iff `encoded` has padding chars at the end
func base64padded(encoded []byte) bool {
	for i := len(encoded) - 1; i > 0; i-- {
		switch encoded[i] {
		case '=':
			return true
		case '\n', '\r':
			/* nothing */
		default:
			return false
		}
	}
	return false
}

func base64Decode(encoded []byte, encoding *base64.Encoding) ([]byte, error) {
	decoded := make([]byte, encoding.DecodedLen(len(encoded)))
	n, err := encoding.Decode(decoded, encoded)
	if err != nil {
		return decoded[:0], err
	}
	return decoded[:n], err
}

func decode(s string) {
	dec := base64.NewDecoder(base64.URLEncoding, bytes.NewBufferString(s))
	n, err := io.Copy(os.Stdout, dec)
	fmt.Printf("\n%d %v\n", n, err)
}

func parseJSON(jsonText []byte) (map[string]json.RawMessage, error) {
	if !json.Valid(jsonText) {
		return nil, fmt.Errorf("invalid json text")
	}
	// parse json text and check for duplicate keys
	hasDuplicates, parsed, err := hasDuplicateKeys(jsonText)
	if hasDuplicates {
		return nil, fmt.Errorf("invalid json text, duplicate keys not allowed")
	}
	if err != nil {
		return nil, fmt.Errorf("invalid json text, %v", err)
	}
	return parsed, nil
}
func opJSONRef(base64url string, key string) (string, error) {

	dvalue, err := base64.RawURLEncoding.DecodeString(base64url)
	if err != nil {
		return "", fmt.Errorf("error decode ")
	}
	// parse json text
	parsed, err := parseJSON(dvalue)
	if err != nil {
		return "", fmt.Errorf("error while parsing JSON text, %v", err)
	}

	// get value from json
	_, ok := parsed[key]
	if !ok {
		return "", fmt.Errorf("key %s not found in JSON text", key)
	}
	var value string
	err = json.Unmarshal(parsed[key], &value)
	if err != nil {
		return "", err
	}

	return value, nil
}
func hasDuplicateKeys(jsonText []byte) (bool, map[string]json.RawMessage, error) {
	dec := json.NewDecoder(bytes.NewReader(jsonText))
	parsed := make(map[string]json.RawMessage)
	t, err := dec.Token()
	if err != nil {
		return false, nil, err
	}
	t, ok := t.(json.Delim)
	if !ok || t.(json.Delim).String() != "{" {
		return false, nil, fmt.Errorf("only json object is allowed")
	}
	for dec.More() {
		var value json.RawMessage
		// get JSON key
		key, err := dec.Token()
		if err != nil {
			return false, nil, err
		}
		// end of json
		if key == '}' {
			break
		}
		// decode value
		err = dec.Decode(&value)
		if err != nil {
			return false, nil, err
		}
		// check for duplicates
		if _, ok := parsed[key.(string)]; ok {
			return true, nil, nil
		}
		parsed[key.(string)] = value
	}
	return false, parsed, nil
}
