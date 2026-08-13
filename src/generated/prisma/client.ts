
import * as process from 'node:process'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
globalThis['__dirname'] = path.dirname(fileURLToPath(import.meta.url))

import * as runtime from "@prisma/client/runtime/client"
import * as $Enums from "./enums"
import * as $Class from "./internal/class"
import * as Prisma from "./internal/prismaNamespace"

export * as $Enums from './enums'
export * from "./enums"
export const PrismaClient = $Class.getPrismaClientClass()
export type PrismaClient<LogOpts extends Prisma.LogLevel = never, OmitOpts extends Prisma.PrismaClientOptions["omit"] = Prisma.PrismaClientOptions["omit"], ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = $Class.PrismaClient<LogOpts, OmitOpts, ExtArgs>
export { Prisma }


export type Admin = Prisma.AdminModel

export type Tenant = Prisma.TenantModel

export type ApiKey = Prisma.ApiKeyModel

export type DomainWhitelist = Prisma.DomainWhitelistModel

export type WidgetConfig = Prisma.WidgetConfigModel

export type Lead = Prisma.LeadModel

export type ConversationLog = Prisma.ConversationLogModel

export type MessengerChannel = Prisma.MessengerChannelModel

export type MessengerConversation = Prisma.MessengerConversationModel

export type ZaloChannel = Prisma.ZaloChannelModel

export type ZaloConversation = Prisma.ZaloConversationModel
