export interface DataRowRedType {
  date: Date
  items: number
}

export interface DataRowType extends DataRowRedType {
  speed: number // in items per sec
}
