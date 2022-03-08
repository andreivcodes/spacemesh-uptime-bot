// Original file: proto/global_state_types.proto

export enum GlobalStateDataFlag {
  GLOBAL_STATE_DATA_FLAG_UNSPECIFIED = 0,
  GLOBAL_STATE_DATA_FLAG_TRANSACTION_RECEIPT = 1,
  GLOBAL_STATE_DATA_FLAG_REWARD = 2,
  GLOBAL_STATE_DATA_FLAG_ACCOUNT = 4,
  GLOBAL_STATE_DATA_FLAG_GLOBAL_STATE_HASH = 8,
}