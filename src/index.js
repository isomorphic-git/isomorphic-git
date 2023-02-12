import './typedefs.js'

import { STAGE } from './api/STAGE.js'
import { TREE } from './api/TREE.js'
import { WORKDIR } from './api/WORKDIR.js'
import { abortMerge } from './api/abortMerge.js'
import { add } from './api/add.js'
import { addNote } from './api/addNote.js'
import { addRemote } from './api/addRemote.js'
import { annotatedTag } from './api/annotatedTag.js'
import { branch } from './api/branch.js'
import { checkout } from './api/checkout.js'
import { clone } from './api/clone.js'
import { commit } from './api/commit.js'
import { currentBranch } from './api/currentBranch.js'
import { deleteBranch } from './api/deleteBranch.js'
import { deleteRef } from './api/deleteRef.js'
import { deleteRemote } from './api/deleteRemote.js'
import { deleteTag } from './api/deleteTag.js'
import { expandOid } from './api/expandOid.js'
import { expandRef } from './api/expandRef.js'
import { fastForward } from './api/fastForward.js'
import { fetch } from './api/fetch.js'
import { findMergeBase } from './api/findMergeBase.js'
import { findRoot } from './api/findRoot.js'
import { getConfig } from './api/getConfig.js'
import { getConfigAll } from './api/getConfigAll.js'
import { getRemoteInfo } from './api/getRemoteInfo.js'
import { getRemoteInfo2 } from './api/getRemoteInfo2.js'
import { hashBlob } from './api/hashBlob.js'
import { indexPack } from './api/indexPack.js'
import { init } from './api/init.js'
import { isDescendent } from './api/isDescendent.js'
import { isIgnored } from './api/isIgnored.js'
import { listBranches } from './api/listBranches.js'
import { listFiles } from './api/listFiles.js'
import { listNotes } from './api/listNotes.js'
import { listRemotes } from './api/listRemotes.js'
import { listServerRefs } from './api/listServerRefs.js'
import { listTags } from './api/listTags.js'
import { log } from './api/log.js'
import { merge } from './api/merge.js'
import { packObjects } from './api/packObjects.js'
import { pull } from './api/pull.js'
import { push } from './api/push.js'
import { readBlob } from './api/readBlob.js'
import { readCommit } from './api/readCommit.js'
import { readNote } from './api/readNote.js'
import { readObject } from './api/readObject.js'
import { readTag } from './api/readTag.js'
import { readTree } from './api/readTree.js'
import { remove } from './api/remove.js'
import { removeNote } from './api/removeNote.js'
import { renameBranch } from './api/renameBranch.js'
import { resetIndex } from './api/resetIndex.js'
import { resolveRef } from './api/resolveRef.js'
import { setConfig } from './api/setConfig.js'
import { status } from './api/status.js'
import { statusMatrix } from './api/statusMatrix.js'
import { tag } from './api/tag.js'
import { updateIndex } from './api/updateIndex.js'
import { version } from './api/version.js'
import { walk } from './api/walk.js'
import { writeBlob } from './api/writeBlob.js'
import { writeCommit } from './api/writeCommit.js'
import { writeObject } from './api/writeObject.js'
import { writeRef } from './api/writeRef.js'
import { writeTag } from './api/writeTag.js'
import { writeTree } from './api/writeTree.js'
import * as Errors from './errors/index.js'

// named exports
export {
  Errors,
  STAGE,
  TREE,
  WORKDIR,
  abortMerge,
  add,
  addNote,
  addRemote,
  annotatedTag,
  branch,
  checkout,
  clone,
  commit,
  getConfig,
  getConfigAll,
  setConfig,
  currentBranch,
  deleteBranch,
  deleteRef,
  deleteRemote,
  deleteTag,
  expandOid,
  expandRef,
  fastForward,
  fetch,
  findMergeBase,
  findRoot,
  getRemoteInfo,
  getRemoteInfo2,
  hashBlob,
  indexPack,
  init,
  isDescendent,
  isIgnored,
  listBranches,
  listFiles,
  listNotes,
  listRemotes,
  listServerRefs,
  listTags,
  log,
  merge,
  packObjects,
  pull,
  push,
  readBlob,
  readCommit,
  readNote,
  readObject,
  readTag,
  readTree,
  remove,
  removeNote,
  renameBranch,
  resetIndex,
  updateIndex,
  resolveRef,
  status,
  statusMatrix,
  tag,
  version,
  walk,
  writeBlob,
  writeCommit,
  writeObject,
  writeRef,
  writeTag,
  writeTree,
}

// default export
export default {
  Errors,
  STAGE,
  TREE,
  WORKDIR,
  add,
  abortMerge,
  addNote,
  addRemote,
  annotatedTag,
  branch,
  checkout,
  clone,
  commit,
  getConfig,
  getConfigAll,
  setConfig,
  currentBranch,
  deleteBranch,
  deleteRef,
  deleteRemote,
  deleteTag,
  expandOid,
  expandRef,
  fastForward,
  fetch,
  findMergeBase,
  findRoot,
  getRemoteInfo,
  getRemoteInfo2,
  hashBlob,
  indexPack,
  init,
  isDescendent,
  isIgnored,
  listBranches,
  listFiles,
  listNotes,
  listRemotes,
  listServerRefs,
  listTags,
  log,
  merge,
  packObjects,
  pull,
  push,
  readBlob,
  readCommit,
  readNote,
  readObject,
  readTag,
  readTree,
  remove,
  removeNote,
  renameBranch,
  resetIndex,
  updateIndex,
  resolveRef,
  status,
  statusMatrix,
  tag,
  version,
  walk,
  writeBlob,
  writeCommit,
  writeObject,
  writeRef,
  writeTag,
  writeTree,
}
