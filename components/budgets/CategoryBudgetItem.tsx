import { CategoryBudgetResult } from '@/lib/types';

type Props = {
  budgetResult: CategoryBudgetResult;
};

export default function CategoryBudgetItem({ budgetResult }: Props) {
  const ratio =
    budgetResult.budget > 0
      ? Math.round((budgetResult.spent / budgetResult.budget) * 100)
      : 0;

  return (
    <article>
      <h3>{budgetResult.categoryName}</h3>

      <dl>
        <div>
          <dt>Budget</dt>
          <dd>{budgetResult.budget} €</dd>
        </div>

        <div>
          <dt>Dépensé</dt>
          <dd>{budgetResult.spent} €</dd>
        </div>

        <div>
          <dt>Restant</dt>
          <dd>{budgetResult.remaining} €</dd>
        </div>

        <div>
          <dt>Ratio</dt>
          <dd>{ratio} %</dd>
        </div>
      </dl>
    </article>
  );
}
