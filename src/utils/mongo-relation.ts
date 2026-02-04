import mongoose from 'mongoose';

/**
 * Inserts new relations into the collection, avoiding duplicates based on the compareFunc.
 * @param model
 * @param relations
 * @param compareFunc
 * @param validateFunc
 * @returns
 */
export function insertCollectionRelations<T = any>(
  model: mongoose.Model<T>,
  relations: any,
  compareFunc: any,
  validateFunc: any = undefined
) {
  if (relations == undefined) {
    return;
  }
  let relationStack: any[] = [];
  for (let relation of relations) {
    if (validateFunc) {
      relation = validateFunc(relation);
    }
    let inStack = false;
    for (let duplicateRelationCheck of relationStack) {
      if (compareFunc(relation, duplicateRelationCheck)) {
        inStack = true;
      }
    }
    if (!inStack) {
      relationStack.push(relation);
    }
  }
  if (relationStack.length > 0) {
    model.insertMany(relationStack);
  }
}

/**
 * Merges N:N relations by comparing existing relations with new ones,
 * removing obsolete relations and creating new ones.
 * @param model Mongoose Model for the relation collection
 * @param relationsToMerge Array of relations to merge (can be null/undefined)
 * @param match MongoDB match query to find existing relations
 * @param compareFunc Function to compare two relations for equality
 * @param validateFunc Function to validate and transform relation data
 */
export async function mergeCollectionRelations<T>(
  model: mongoose.Model<T>,
  relationsToMerge: any[] | null | undefined,
  match: Record<string, any>,
  compareFunc: (a: any, b: any) => boolean,
  validateFunc: (relation: any) => any
): Promise<void> {
  // Filter duplicates and validate
  const relationStack: any[] = [];

  if (relationsToMerge != null) {
    for (const relation of relationsToMerge) {
      // extract_dict_by_structure is replaced by direct mongoose model instantiation
      // The validateFunc should handle the structure extraction and validation
      const validatedRelation = validateFunc(relation);

      if (
        !relationStack.some((duplicateRelationCheck) =>
          compareFunc(validatedRelation, duplicateRelationCheck)
        )
      ) {
        relationStack.push(validatedRelation);
      }
    }
  }

  if (relationStack.length === 0) {
    // Delete all matching relations if no new relations to merge
    await model.deleteMany(match);
  } else {
    // Find existing relations
    const existingRels = await model.find(match).lean();
    const toRemoveRels: any[] = [];

    // Find relations to remove (exist in DB but not in new stack)
    for (const rel of existingRels) {
      if (!relationStack.some((relationFromStack) => compareFunc(rel, relationFromStack))) {
        toRemoveRels.push(rel);
      }
    }

    // Find relations to create (in new stack but not in DB)
    const toCreateRels: any[] = [];
    for (const relationFromStack of relationStack) {
      if (!existingRels.some((rel) => compareFunc(rel, relationFromStack))) {
        toCreateRels.push(relationFromStack);
      }
    }

    // Execute operations
    if (toCreateRels.length > 0) {
      await model.insertMany(toCreateRels);
    }

    if (toRemoveRels.length > 0) {
      const idsToRemove = toRemoveRels.map((rel) => rel._id);
      await model.deleteMany({ _id: { $in: idsToRemove } });
    }
  }
}
