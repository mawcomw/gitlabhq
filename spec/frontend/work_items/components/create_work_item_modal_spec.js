import Vue, { nextTick } from 'vue';
import VueApollo from 'vue-apollo';
import { GlDisclosureDropdownItem, GlModal } from '@gitlab/ui';
import { shallowMount } from '@vue/test-utils';
import namespaceWorkItemTypesQueryResponse from 'test_fixtures/graphql/work_items/namespace_work_item_types.query.graphql.json';
import { setNewWorkItemCache } from '~/work_items/graphql/cache_utils';
import createMockApollo from 'helpers/mock_apollo_helper';
import waitForPromises from 'helpers/wait_for_promises';
import CreateWorkItem from '~/work_items/components/create_work_item.vue';
import CreateWorkItemModal from '~/work_items/components/create_work_item_modal.vue';
import { WORK_ITEMS_TYPE_MAP, WORK_ITEM_TYPE_ROUTE_WORK_ITEM } from '~/work_items/constants';
import namespaceWorkItemTypesQuery from '~/work_items/graphql/namespace_work_item_types.query.graphql';

const showToast = jest.fn();
jest.mock('~/work_items/graphql/cache_utils', () => ({
  setNewWorkItemCache: jest.fn(),
}));

Vue.use(VueApollo);

describe('CreateWorkItemModal', () => {
  let wrapper;
  let apolloProvider;

  const findTrigger = () => wrapper.find('[data-testid="new-epic-button"]');
  const findDropdownItem = () => wrapper.findComponent(GlDisclosureDropdownItem);
  const findModal = () => wrapper.findComponent(GlModal);
  const findForm = () => wrapper.findComponent(CreateWorkItem);
  const findOpenInFullPageButton = () => wrapper.find('[data-testid="new-work-item-modal-link"]');

  const namespaceSingleWorkItemTypeQueryResponse = {
    data: {
      workspace: {
        ...namespaceWorkItemTypesQueryResponse.data.workspace,
        workItemTypes: {
          nodes: [namespaceWorkItemTypesQueryResponse.data.workspace.workItemTypes.nodes[0]],
        },
      },
    },
  };

  const workItemTypesQueryHandler = jest.fn().mockResolvedValue({
    data: namespaceSingleWorkItemTypeQueryResponse.data,
  });

  const workItemTypesEmptyQueryHandler = jest.fn().mockResolvedValue({
    data: {
      workspace: {
        workItemTypes: {
          nodes: [],
          __typename: 'WorkItemType',
        },
      },
    },
  });

  const createComponent = ({
    asDropdownItem = false,
    hideButton = false,
    workItemTypeName = 'EPIC',
    namespaceWorkItemTypesQueryHandler = workItemTypesQueryHandler,
  } = {}) => {
    apolloProvider = createMockApollo([
      [namespaceWorkItemTypesQuery, namespaceWorkItemTypesQueryHandler],
    ]);

    wrapper = shallowMount(CreateWorkItemModal, {
      propsData: {
        workItemTypeName,
        asDropdownItem,
        hideButton,
      },
      apolloProvider,
      provide: {
        fullPath: 'full-path',
      },
      mocks: {
        $toast: {
          show: showToast,
        },
      },
      stubs: {
        GlModal,
      },
    });
  };

  it('passes workItemTypeName to CreateWorkItem and sets the cache', async () => {
    createComponent();

    expect(findForm().props('workItemTypeName')).toBe('EPIC');

    await waitForPromises();

    expect(setNewWorkItemCache).toHaveBeenCalled();
  });

  it('shows toast on workItemCreated', async () => {
    createComponent();

    await waitForPromises();
    findForm().vm.$emit('workItemCreated', { webUrl: '/' });

    expect(showToast).toHaveBeenCalledWith('Epic created', expect.any(Object));
  });

  describe('default trigger', () => {
    it('opens modal and prevents following link on click', async () => {
      createComponent();

      await waitForPromises();

      const mockEvent = { preventDefault: jest.fn() };
      findTrigger().vm.$emit('click', mockEvent);

      await nextTick();

      expect(findModal().props('visible')).toBe(true);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('does not open modal or prevent link default on ctrl+click', async () => {
      createComponent();

      await waitForPromises();

      const mockEvent = { preventDefault: jest.fn(), ctrlKey: true };
      findTrigger().vm.$emit('click', mockEvent);

      await nextTick();

      expect(findModal().props('visible')).toBe(false);
      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });

    it('does not render when hideButton=true', () => {
      createComponent({ hideButton: true });

      expect(findTrigger().exists()).toBe(false);
    });
  });

  describe('dropdown item trigger', () => {
    it('renders a dropdown item component', () => {
      createComponent({ asDropdownItem: true });

      expect(findDropdownItem().exists()).toBe(true);
    });
  });

  it('opens modal when visible prop updates to true', async () => {
    createComponent();

    expect(findModal().props('visible')).toBe(false);

    await wrapper.setProps({ visible: true });

    expect(findModal().props('visible')).toBe(true);
  });

  it('closes modal on cancel event from form', async () => {
    createComponent();

    await waitForPromises();

    await nextTick();

    findForm().vm.$emit('cancel');

    expect(findModal().props('visible')).toBe(false);
  });

  for (const [workItemTypeName, vals] of Object.entries(WORK_ITEMS_TYPE_MAP)) {
    it(`has link to new work item page in modal header for ${workItemTypeName}`, async () => {
      createComponent({ workItemTypeName });

      const routeParamName = vals.routeParamName || WORK_ITEM_TYPE_ROUTE_WORK_ITEM;

      await waitForPromises();

      expect(findOpenInFullPageButton().attributes().href).toBe(
        `/full-path/-/${routeParamName}/new`,
      );
    });
  }

  it('when there are no work item types it does not set the cache', async () => {
    createComponent({ namespaceWorkItemTypesQueryHandler: workItemTypesEmptyQueryHandler });

    await waitForPromises();

    expect(setNewWorkItemCache).not.toHaveBeenCalled();
  });

  it('when the work item type is invalid it does not set the cache', async () => {
    createComponent({ workItemTypeName: 'INVALID' });

    await waitForPromises();

    expect(setNewWorkItemCache).not.toHaveBeenCalled();
  });

  it('resets the cache on work item created event', async () => {
    createComponent();

    await waitForPromises();

    await nextTick();

    findForm().vm.$emit('workItemCreated', { webUrl: '/' });

    expect(setNewWorkItemCache).toHaveBeenCalled();
  });
});
