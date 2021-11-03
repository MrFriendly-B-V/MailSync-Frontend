export interface Message {
    id:             string,
    from:           string,
    to:             string,
    body:           string,
    cc:             string,
    bcc:            string,
    subject:        string,
    timestamp:      number
}