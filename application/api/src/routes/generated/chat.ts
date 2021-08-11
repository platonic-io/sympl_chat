import { chat } from '../../assembly-wrapper';
import {Context} from 'koa';
import Router from 'koa-router';

const assemblyRouter : Router = new Router();

assemblyRouter.post('/create_room', async (ctx: Context) => {
    ctx.body = await chat.createRoom(ctx.state.user, 
        ctx.state.room_name
    );
})
assemblyRouter.post('/invite_to_room', async (ctx: Context) => {
    ctx.body = await chat.inviteToRoom(ctx.state.user, 
        ctx.state.room_channel, 
        ctx.state.new_member
    );
})
assemblyRouter.post('/send_message', async (ctx: Context) => {
    ctx.body = await chat.sendMessage(ctx.state.user, 
        ctx.state.room_channel, 
        ctx.state.message
    );
})
assemblyRouter.post('/remove_from_room', async (ctx: Context) => {
    ctx.body = await chat.removeFromRoom(ctx.state.user, 
        ctx.state.member_to_remove, 
        ctx.state.room_channel
    );
})
assemblyRouter.post('/get_rooms', async (ctx: Context) => {
    ctx.body = await chat.getRooms(ctx.state.user
    );
})
assemblyRouter.post('/restore_room', async (ctx: Context) => {
    ctx.body = await chat.restoreRoom(ctx.state.user, 
        ctx.state.room_channel
    );
})
assemblyRouter.post('/get_messages', async (ctx: Context) => {
    ctx.body = await chat.getMessages(ctx.state.user, 
        ctx.state.room_channel
    );
})
assemblyRouter.post('/delete_room', async (ctx: Context) => {
    ctx.body = await chat.deleteRoom(ctx.state.user, 
        ctx.state.room_channel
    );
})


export const assembly_router : Router = assemblyRouter;
