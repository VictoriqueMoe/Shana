# <ins>Shana</ins>

Shana is a bespoke automod bot that is written in Typescript using the Discordx framework

### Global settings

Misc Settings:

| setting            | Description                                                                                                                                       |
|--------------------|---------------------------------------------------------------------------------------------------------------------------------------------------|
| JAIL_ROLE          | The role that you give to members when you want to send them to your jail channel. this is used in the Auto Role module                           |
| YOUNG_ACCOUNT_ROLE | This is the role you wish the bot to apply to accounts that are new to Discord if you have the `min Account Age` prop enabled on Auto Role module |

Channel Settings:

| Setting           | Description                                                                                                             |
|-------------------|-------------------------------------------------------------------------------------------------------------------------|
| LOG_CHANNEL       | The channel for the `Audit Log` module to post to                                                                       |
| ADMIN_LOG_CHANNEL | the channel for the  `Admin Loggers` modules to post to                                                                 |
| JAIL_CHANNEL      | the channel you use to `jail` members                                                                                   |
| BIRTHDAY_CHANNEL  | Used in the `birthday` command to wish members happy birthday, if this setting is not set, the command will be disabled |

## <ins>Modules</ins>

All modules in this application are defined by implementing the `ICloseableModule` interface. this applies to events
only, not commands. Commands are defined in the own entity set contained in categories.

### <ins>events</ins>

#### Audit Logger

The Audit logger is a non-admin styled logger designed to log quick events like when a member joins, leaves, is kicked
or banned (along with by whom) and when an Auto Mod event is triggered.

In order for this module to work, it must be both enabled AND have the `LOG_CHANNEL` global setting populated with the
ID of a channel

This is a quick non-admin style logger that can log:

- Member join
- Member kick
- Member leave
- Member muted
- Member un-muted
- Member ban

***

#### Admin Loggers

Admin Loggers are an embed style logger that will post realtime, detailed events to a chosen channel, these events are
presented in a rich-embed. All triggered events contain an executor, the executor is the member who triggered the event;
for example, if i deleted your message in Discord, then i would be the executor

for example, if a message is deleted, kicked, banned, or even if a channel was modified or created. It will display who
caused that action from the audit logs

In order for these modules to work, it must be both enabled AND have the `ADMIN_LOG_CHANNEL` global setting populated
with the ID of a channel.

they consist of:

* Channel Logger
* Guild Logger
* Member Logger
* Message Logger
* Role Logger

##### Channel Logger

The Channel logger will log:

- Channel Create
- Channel Delete
- Channel Updated
- Thread Create
- Thread Delete
- Thread Update

##### Guild Logger

The Guild logger will log:

- Server changes
  - name
  - description
  - banner
  - rules channel (community)
  - splash image
  - Discovery image (community)
  - Server Icon
  - Vanity URL

##### Member Logger

The Member logger will log:

* Member join
* Member ban
* Member kick
* Member leave
* Member unBanned
* Member updated
* Member joins/leaves VC

##### Message Logger

The Message logger will log:

* Message Edited
* Messaged Deleted
* Bulk Message Deletion

Note for Message deleted. this will not only log the deleted message, but will log (and post), any attachment that was
contained in the message.

so if a message was deleted, and it contained an image, that image will be logged. if it contained a video, the video
will be logged. this will work for ANY attachment, be it image, video, binary file, a pdf, etc...

##### Role Logger

The Role logger will log:

* Role Created
* Role Deleted
* Role Updated
* Role Given
* Role Removed

***

#### AutoMod

The auto mod module is a power moderation filter that augments the built-in discord auto mod feature with extra features
such as kicking, muting, banning and warning users, logging them and using regex in pattern matching for text.

this module relies on a number of submodules known as filters. a Filter is a self-contained and isolated unit of work
that takes a message and returns true or false if that message violated the filter.

Each filter can be turned on and off

the list of filters are:

- All Caps Filter
- Banned Word Filter
- Discord Invite Filter
- Emoji Spam Filter
- Everyone Mentions Filter
- Fast Message Spam Filter
- Image Spam Filter
- Link Cooldown Filter
- Mass Mentions Filter
- Spam Filter
- Spoilers Filter
- Zalgo Text Filter

| Filter                   | Description                                                                                                                                                                                                                                                                                                                                                                                                                 |
|--------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| All Caps Filter          | Filter will fail if more than 70% of the message is capitalised                                                                                                                                                                                                                                                                                                                                                             |
| Banned Word Filter       | Defines a list of banned words that will fail the filter if a message contains one of the words defined. <br/> <br/> the Banned word filter defined 2 sets of words, these are `exactWord` and `wildCardWords`. <br/> <br/> the `exactWord` filter will only a message contains EXACTLY that word in it. <br/> <br/> the `wildCardWords` uses a regex to check if a message contains that word in any of the text supplied. |
| Discord Invite Filter    | Prevents users from posting invite links                                                                                                                                                                                                                                                                                                                                                                                    |
| Emoji Spam Filter        | defines how many emojis in a single message is allowed. this is configurable by the filters `value` prop. this defaults to 6                                                                                                                                                                                                                                                                                                |
| Everyone Mentions Filter | Fails the filter if someone does `@everyone` this filter will only trigger if the member posting does NOT have the `MentionEveryone` permission.                                                                                                                                                                                                                                                                            |
| Fast Message Spam Filter | This defines how many messages (in 5 seconds) someone can post. this will fail the filter if someone posts more messages than set by the `value` prop. defaults to 5 messages. this will additinally delete all the messages being posted during that 5 second gap if failed. (if the filter action contains a `delete`)                                                                                                    |
| Image Spam Filter        | same as above but defines how many images someone is allowed to post in 10 seconds. due to the conflict of the image and fast message spam filter, these filters can not be enabled at the same time. they are mutually exclusive only                                                                                                                                                                                      |
| Link Cooldown Filter     | same as above but defines how many URLS someone is allowed to post in a defined time in the `value` prop. defaults to 5                                                                                                                                                                                                                                                                                                     |
| Mass Mentions Filter     | Defines how many mentions allowed on a single message. this defaults to 6 and is configured using the `value` prop                                                                                                                                                                                                                                                                                                          |
| Spam Filter              | The spam filter is defunct and will be removed                                                                                                                                                                                                                                                                                                                                                                              |
| Spoilers Filter          | if set, this filter will fail when a spoiler is posted                                                                                                                                                                                                                                                                                                                                                                      |
| Zalgo Text Filter        | if set, this filter will fail if zalgo is posted                                                                                                                                                                                                                                                                                                                                                                            |

Each filter defines:

* actions (is an array of multiple actions)
  * Warn
  * Delete
  * Mute
  * Bane
  * Kick
  * None
* warn Message
* priority
* terminal Violation Timeout
* auto Terminal Violation Count
* auto Mute Timeout

| Prop                          | Description                                                                                                                                                                                                                                                                                                                                                                                         |
|-------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| actions                       | Actions are used to define what action takes place if a filter fails. <br/> `Kick`, `Ban`, and `Mute` are defined as Terminal actions, this means if this action is taken, no more actions can be performed.                                                                                                                                                                                        |
| warn Message                  | If an action is `warn` then this message will be posted when a filter fails.                                                                                                                                                                                                                                                                                                                        |
| priority                      | this gives a order to each filter.                                                                                                                                                                                                                                                                                                                                                                  |
| terminal Violation Timeout    | This defines long to wait (in seconds) to cooldown the `auto MuteViolation Count` value. <br/> <br/> for example, if autoTerminalViolationCount is set to 2 and this is set to 30 then each member will have 30 seconds to violate 2 terminal filters starting from the first violation. If a member violates ONE terminal filter and not another within 30 seconds, then the counter is reset to 0 |
| auto Terminal Violation Count | this sets the amount of filters that define a `terminal operation` (mute, kick and ban) as punishment that needs to fail before the action is automatically taken                                                                                                                                                                                                                                   |
| auto Mute Timeout             | How long (in seconds) are members muted for if they violate a filter with the `mute` action                                                                                                                                                                                                                                                                                                         |

***

#### Auto Responder

This module allows you to react to a message that is posted.

If you are familiar with Dyno's auto-responder, then it works almost the exact same way with some additional features
like OCR (optical character recognition) and some extra actions.

Each Auto Responder entry contains:

- title
- response Type
- settings
  - use Regex
  - wildCard
  - public Delete
  - use OCR
  - emoji Reactions
  - response

the entries are defined as:

| prop          | Description                                                                                                                                                                                                                                           |
|---------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| title         | This is trigger word, depending on the settings, this word will be exactly matched. <br/> <br/> if the title is `foo` and someone posts a message saying `foo`  then this responder will trigger, if they say `foo bar` then it will not be triggered |
| response Type | A response type is what happens when a auto responder triggers, can be ONE of the following: <br/> <ul><li> message </li><li> reaction </li><li> delete </li><li> kick </li></ul>                                                                     |

| Setting         | Description                                                                                                                                                                |
|-----------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| use Regex       | if true, then your title can be a regex input. if set then `wildcard` will be disabled                                                                                     |
| wildCard        | if true, then the message will be searched for the word that matches the title. `use Regex` will be disabled if this is true                                               |
| public Delete   | Public delete means that if the responder is triggered, then the message will also be deleted. this option is ONLY available if the `response type` is `message` or `kick` |
| use OCR         | If true, then it will use an OCR engine to scan an image for text.                                                                                                         |
| Emoji Reactions | this is only available if `response type` is set to `reaction`, it will allow you to set an array of emojis to use when reacting to the message                            |
| Response        | This is only available if `response type` is set to `message`. this will be the message bot will post when a auto responder is triggered.                                  |

You can only have ONE type of response type per auto responder.

| Response type | Description                                                                                                                                                                                                       |
|---------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Message       | If the auto responder is set to `message` then the bot will post a message containing the text supplied in the `response` prop. this also allows you to put in variables that will be explained in the next table |
| Reaction      | If the auto responder is set to `reaction` then the bot will react to the message that triggered the auto responder, the reactions it will respond to are defined in the `emoji Reactions` prop                   |
| delete        | If the auto responder is set to `delete` then the bot will simply just delete the message that caused the trigger                                                                                                 |
| kick          | If the auto responder is set to `kick` then the bot will kick the user. the `response` prop is also used in this mode but in this case, the bot will DM the user with the `response`                              |

***

#### Auto Role

The Auto role module deals with applying roles to members when they join with an optional timeout. the roles that can be
applied are flexible and can be configured in the modules settings.

| Setting            | Description                                                                                                                                                                                                                                                                                                |
|--------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| role               | An array of role ID's to apply to the member who joins                                                                                                                                                                                                                                                     |
| min Account Age    | If set, then this will apply the `young account role` instead of the roles defined above to any member who's account age is below this limit. this is useful for giving new accounts on discord a different role <br/> <br/> you must have the GLOBAL setting of `YOUNG_ACCOUNT_ROLE` set for this to work |
| autoJail           | Automatically jail members who had previously left the server while in jail and rejoined . this requires the `JAIL_ROLE` global setting to be set                                                                                                                                                          |
| panicMode          | if enabled, all members who join will automatically be allowed the `YOUNG_ACCOUNT_ROLE`. this is helpful for a suspected flood                                                                                                                                                                             |
| massJoinProtection | defines the threshold for members joining in 10 seconds before automatically enabling `panicMode`                                                                                                                                                                                                          |
| autoRoleTimeout    | How long to wait before the autoRole is applied (ignored for unverified and auto-jail/ato-mute)                                                                                                                                                                                                            |

***

#### Trigger Constraint

This is not a module. but rather a global filter that defines a set of constraints that will cause a module to trigger
or not.

This constraint is attatched to:

- Auto Mod
- Auto Responder

This constraint adds some additional settings to the modules listed above. these settings are:

| Setting          | Description                                                                                                                                                                                                                      |
|------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| allowed Channels | allowed Channels will constrain the module to only trigger under these channels. if you set this, then `ignored channels` will be disabled                                                                                       |
| ignored Channels | ignored channels will simply ignore the module from these channels, if the message posted is in a channel in this array, then the module will be ignored. if you set this, then `allowed Channels` will be disabled              |   
| allowed Roles    | Allowed roles does the same as allowed channels but for roles. if you populate this array, then the module will ONLY trigger for members who have the roles in the array. if you set this, then `ignored Roles` will be disabled |
| ignored Roles    | Ingored roles will do the same as ignored channels but for roles, if anyone has a role defined in tis array, then it will bypass the module. if you set this, then `allowed Roles` will be disabled                              |

***

## <ins>Commands</ins>

This bot comes with a set of commands. each command belongs to a group, and each group belongs to a global category.
there are 3 categories

- Members
- Fun
- Misc

Members are commands that have no security constraint and by default can be used by all.

Fun are non-automod related commands that also have no security constraint and can be used by all.

Misc is a mix of commands that have a default security constraint attached. all commands will be explained below:

`N/A` constraint means by default, ALL members can use it

- Slash - type `/` to run message
- Message contest menu - right-click the message and go to `apps` to run command
- User context menu - Right-click the user and go to `apps` to run command

| Command                                    | Description                                                                                                                                                                                                                                                                                                                                                                                              | Default security constraint | Type                 |
|--------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------|:---------------------|
| /ages channel_age                          | Get the age of a channel                                                                                                                                                                                                                                                                                                                                                                                 | N/A                         | Slash                |
| /ages server_age                           | Get the age of the current server                                                                                                                                                                                                                                                                                                                                                                        | N/A                         | Slash                |
| /ages user_age                             | Get the age of a users account                                                                                                                                                                                                                                                                                                                                                                           | N/A                         | Slash                |
| /bans clean_bans                           | Will remove all the deleted accounts from the servers bans                                                                                                                                                                                                                                                                                                                                               | BanMembers                  | Slash                |
| /birthday add_birthday                     | Add a birthday                                                                                                                                                                                                                                                                                                                                                                                           | N/A                         | Slash                |
| /birthday next_birthdays                   | Get the next 10 birthdays                                                                                                                                                                                                                                                                                                                                                                                | N/A                         | Slash                |
| /birthday remove_birthday                  | Remove your birthday                                                                                                                                                                                                                                                                                                                                                                                     | N/A                         | Slash                |
| /bookmarks deletebookmarks                 | Remove a bookmark by title                                                                                                                                                                                                                                                                                                                                                                               | N/A                         | Slash                |
| /bookmarks getbookmark                     | Get all your bookmarks                                                                                                                                                                                                                                                                                                                                                                                   | N/A                         | Slash                |
| /message_schedule get_scheduled_message    | get all scheduled posts optionally by channel                                                                                                                                                                                                                                                                                                                                                            | ManageMessages              | Slash                |
| /message_schedule add_scheduled_message    | create a message to schedule a post from cron to a channel                                                                                                                                                                                                                                                                                                                                               | ManageMessages              | Slash                |
| /message_schedule remove_scheduled_message | remove a scheduled post by name                                                                                                                                                                                                                                                                                                                                                                          | ManageMessages              | Slash                |
| /miscellaneous find_anime                  | return the info of an anime by it's screenshot                                                                                                                                                                                                                                                                                                                                                           | N/A                         | Slash                |
| /miscellaneous find_source                 | Reverse image search a image and find the source                                                                                                                                                                                                                                                                                                                                                         | N/A                         | Slash                |
| miscellaneous translate                    | Translate a message                                                                                                                                                                                                                                                                                                                                                                                      | N/A                         | Message Context menu |
| miscellaneous avatar                       | Get the avatar of a member                                                                                                                                                                                                                                                                                                                                                                               | N/A                         | User context menu    |
| miscellaneous banner                       | Get the banner of a user if they have one                                                                                                                                                                                                                                                                                                                                                                | N/A                         | User context menu    |
| /notes add_note                            | Add a private note                                                                                                                                                                                                                                                                                                                                                                                       | N/A                         | Slash                |
| /notes edit_note                           | Edit a private note via title                                                                                                                                                                                                                                                                                                                                                                            | N/A                         | Slash                |
| /notes get_notes                           | Get all of your private notes or just a single note from title                                                                                                                                                                                                                                                                                                                                           | N/A                         | Slash                |
| /notes delete_note                         | Delete a private note                                                                                                                                                                                                                                                                                                                                                                                    | N/A                         | Slash                |
| /secure no_roles                           | Set all users who do not have any roles to the Auto Role role                                                                                                                                                                                                                                                                                                                                            | ManageRoles and MuteMembers | Slash                |
| /secure mutes                              | Get a list of all members who are muted using Discords mute feature                                                                                                                                                                                                                                                                                                                                      | ManageRoles and MuteMembers | Slash                |
| /username username                         | Set a members username with the ability to force set it. this will prevent the user from changing it. another affect of this command is that if a member leaves and comes back, then the username will automatically be set with the username set with this command <br/> <br/>to clear a username out of the database, then you must `reset` it back to blank using discord's built in nickname changer | ManageNicknames             | Slash                |
| /username view_usernames                   | View all the persisted usernames this bot is aware of                                                                                                                                                                                                                                                                                                                                                    | ManageNicknames             | Slash                |

## <ins>Code Structure</ins>

This bot is architected in a way to take heavy use of decorators, DAO's, Managers, Factories, Engines and Dependency
Injection. It's main design pattern is the decorator pattern with its main underlying framework being Discord.js wrapped
in Discordx and with my persistence and service layer on top of it. Each manager that acts as the repository to the
DAO
has its own internal cache that works with discord.js's cache to be as performant as possible.

The code is very "interface first", in that any public method outside a singleton is defined in an interface and
abstracted with heavy use of generics and abstract classes, as well as dependency injection that is all loaded on
runtime.

If you are familiar with Java Spring and its way of coding styles, this architecture will seem familiar to you.

## <ins>Dependency Injection</ins>

The main guts of this application is all wired together with the use of a Dependency Injection framework to supply an
Inversion of Control (IOC) architecture to the low level bootstrapping and initialisation of class singletons.

Each class defined by a `@Discord()` or `@singleton()` are all registered with tsyringe's global object registry
container. and is injected into the constructors of classes that need them.

There also exists Spring-like `@PostConstruct` annotations to facilitate the post construction initialisation method
that is called after the object is constructed and resolved and `@Property` used to inject settings from source agnostic
paths
