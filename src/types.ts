export type JobMode = 'todaysEvents' | 'pollEvents'

export interface EventObject {
  id: number
  starts: string
  name: string
  association: string
  closed: boolean
}
