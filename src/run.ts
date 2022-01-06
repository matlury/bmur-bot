import { handleEvent } from './index'

handleEvent({ jobMode: process.env.JOB_MODE as any })
