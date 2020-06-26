interface IEndpoint {
  address: string;
  type: string;
  target?: string;
  user?: string;
  password?: string;
  salt?: string;
}
export{IEndpoint}
